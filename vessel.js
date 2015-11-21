 var vessel={};//数据库对象
vessel.collections=[];
vessel.instances=[];
vessel.colIndex=0;
vessel.insIndex=0;
vessel.curCollection=null;//当前数据集合
vessel.isConnect=false;
//连接vessel数据库
vessel.connect=function(){
	//"undefined" --chrome认 、null --360急速浏览器认
	if((collections=localStorage.getItem("collections"))!= "undefined" && collections!=null){
		this.collections=JSON.parse(collections);
		this.colIndex=this.collections.length;
		//获取各个实例数据
		if((instances = localStorage.getItem("instances"))!= "undefined" && instances!=null){
			//alert(typeof(instances));
			//if(instances == "undefined") alert("undefined");
			this.instances=JSON.parse(instances);
			this.insIndex=this.instances.length;
		}else{
			console.log("实例数据为空，可以为指定数据集新建数据集！");
		}
	}else{
		console.log("数据集合为空，现在可以新建！");
	}
	this.isConnect=true;
}

//添加数据集合
vessel.createCollecion=function(name){
	if(this.checkIsConnect() && ! this.checkCollectionExist(name)){//检查连接
		var temp={
			id:this.colIndex,
			name:name,
			subsets:[]
			}
		//加入系统记录
		this.collections.push(temp);
		this.colIndex++;
		//更新本地存储
		this.updateCollections();
		console.log("新建集合成功！");
	}
}
//检查是否存在集合，保证集合的唯一性
vessel.checkCollectionExist=function(name){
	for(i=0;i<this.collections.length;i++){
		if(this.collections[i].name==name){
			console.log("集合<"+name+">已经存在");
			return true;
		}
	}
	//console.log("集合<"+name+">不存在");
	return false;
}
vessel.getCollections=function(){
	if(this.checkIsConnect()){
		return this.collections;
	}
}
//选择数据集 
vessel.useCollection=function(name){
	if(this.checkIsConnect()){
		for(i=0;i<this.collections.length;i++){
			if(name==this.collections[i].name){
				this.curCollection = this.collections[i];
				console.log("当前集合已经切换到"+name);
				return true;
			}
		}
		console.log("你选择的集合<"+name+">不存在！");
		return false;
	}
}
//删除数据集
vessel.deleteCollection=function(collectionName){
	if(this.checkIsConnect() && !this.checkIsCurCollection(collectionName)){
		//alert(this.collections.length);
		for(i=0;i<this.collections.length;i++){
			if(this.collections[i].name==collectionName){
				//找到数据集
				var colIndex=i;
				var curCollection=this.collections[i];
				//alert(i+","+this.collections[i].name);
				//i在子函数中使用，能同时使用。
				for(j=0;j<curCollection.subsets.length;j++){
					//删除所有的数据子集
					this.deleteSubsetNoCheck(curCollection,curCollection.subsets[j].name);
				}
				//alert(colIndex);
				this.collections.remove(colIndex);
				this.updateCollections();//更新保存到本地存储
				console.log("已经删除数据集和所有子集！");
				break;
			}
		}
	}
}
//检查是否是当前数据库
vessel.checkIsCurCollection(collectionName){
	if(this.curCollection!=null && this.curCollection.name==collectionName){
		console.log(collectionName+"是当前数据集合！不能执行不操作！");
		return true;
	}else{
		return false;
	}
}
//添加数据子集
vessel.createSubset=function(subsetName){
	if(this.checkIsConnect()){//检查连接
		if(this.checkCurCollecion() && !this.checkSubsetExist(subsetName)){//检查数据集选择
			var temp={
				name:subsetName,
				}
			this.curCollection.subsets.push(temp);
			//更新本地存储
			this.updateCollections();
			console.log("新建子集成功！");
		}
	}
}
vessel.getSubsets=function(){
	if(this.checkIsConnect()){
		if(this.checkCurCollecion()){
			return this.curCollection.subsets;
		}
	}	
}
//删除数据子集
vessel.deleteSubset=function(subsetName){
	if(this.checkIsConnect() && this.checkCurCollecion()){
		deleteSubsetNoCheck(this.curCollection,subsetName);
	}
}
//抽象公共方法，给删除数据库使用
vessel.deleteSubsetNoCheck=function(curCollection,subsetName){
	//搜索子集
		var subsets=curCollection.subsets;
		for(i=0;i<subsets.length;i++){
			if(subsets[i].name==subsetName){
				//找到子集				
				//删除对应子集的实例数据
				var subsetIndex=i;//先记录下标
				this.deleteInstancesWhereSubsetName(subsetName);
				this.updateInstances();//修改更新到物理存储
				subsets.remove(subsetIndex);//移除该子集
				this.updateCollections();//修改更新到物理存储
				console.log("已经删除子集和子集的所有实例数据！");
				break;
			}
		}
}
//根据子集名称删除所有实例数据
vessel.deleteInstancesWhereSubsetName=function(subsetName){
	for(i=0;i<this.instances.length;i++){
		if(this.instances[i].name==subsetName){
			this.instances.remove(i);//删除所有实例数据
			break;
		}
	}
}
//添加实例数据
vessel.insertSubset=function(targetSubset,jsonVal){
	if(this.checkIsConnect() &&	this.checkCurCollecion() && this.checkSubsetExist(targetSubset)){//检查子集是否存在
		//第一个插入targetSubset
		var temp={};
		var res=null;
		if(!(res=this.checkInstanceOfSubsetExist(targetSubset))){
			//子集实例不存在，新建
			temp.name="";
			temp.count="";
			temp.contents=[];
			temp.name=targetSubset;//这个是唯一的
			
		}else{//子集实例存在
			temp= res;
		}
		temp.count=this.subsetNextNum(targetSubset);//下面是表中的内容
		jsonVal.internalNo=temp.count-1;//给添加的json数据加上内部编号
		temp.contents.push(jsonVal);
		this.instances.push(temp);
		this.updateInstances();
		this.insIndex++;
		console.log("数据实例插入成功！");
	}
}
//修改实例数据
vessel.updateInstance=function(targetSubset,jsonVal,indexVal){
	if(this.checkIsConnect() &&	this.checkCurCollecion()){
		
		var instanceRes=this.getTargetInstance(targetSubset,indexVal);
		if(instanceRes!=null){
			for(i=0;i<instanceRes.length;i++){
				for(var key1 in jsonVal){
					instanceRes[i][0][key1]=jsonVal[key1];//开始更新目标值
				}				
			}
		//保存到本地物理存储
			this.updateInstances();			
		}else{
			console.log('实例数据不存在！');
		}
		/*
		for(var key1 in jsonVal){
			instance[key1]=jsonVal[key1];//开始更新目标值
		}
		//保存到本地物理存储
		this.updateInstances();
		*/
	}
}
//扩展数组的方法
Array.prototype.remove=function(dx) 
{ 
    if(isNaN(dx)||dx>this.length){return false;} 
    for(var i=0,n=0;i<this.length;i++) 
    { 
        if(this[i]!=this[dx]) 
        { 
            this[n++]=this[i];
        } 
    } 
    this.length-=1;
} 
//删除实例数据
vessel.deleteInstance=function(targetSubset,indexVal){
	var instanceRes=this.getTargetInstance(targetSubset,indexVal);
	if(instanceRes!=null){
		//获取目标实例在实例集合中的下标
		for(i=0;i< instanceRes.length;i++){
			var index=instanceRes[i][2];
			var index2=instanceRes[i][1];
			this.instances[index2].contents.remove(index);//删除指定下标数组元素
			this.instances[index2].count -= 1;//子集的实例总数减一
		}
		//保存到本地物理存储
		this.updateInstances();
	}else{
		console.log('实例数据不存在！');
	}
}

//获取目标数据实例
vessel.getTargetInstance=function(targetSubset,indexVal){
	if(this.checkIsConnect() &&	this.checkCurCollecion()){
		var resArray=null;
		for(i=0;i<this.instances.length;i++){
		//查找目标子集的实例数组
			if(this.instances[i].name==targetSubset){
				//根据索引值获取目标实例
				var isFind=false;
				for(j=0;j<this.instances[i].contents.length && (!isFind);j++){
					for(var key in indexVal){//单条件匹配，或 
						if(this.instances[i].contents[j][key]==indexVal[key]){
							//得到目标实例
							var instance=this.instances[i].contents[j];
							if(resArray==null)resArray=[];//声明为数组
							resArray.push([instance,i,j]);							
							break;
						}
					}
				}
				break;
			}
		}
		return resArray;//没找到目标实例
	}
	return null;
}
//检查子集是否存在实例
vessel.checkInstanceOfSubsetExist=function(subsetName){
	for(i=0;i<this.instances.length;i++){
		if(this.instances[i].name==subsetName){
			return this.instances[i];//子集实例存在，返回实例子集
		}
	}
	return false;
}
//获取某个子集的下一实例编号
vessel.subsetNextNum=function(subsetName){
	for(i=0;i<this.instances.length;i++){
		if(this.instances[i].name==subsetName){
			return ++this.instances[i].count;
		}
	}
	return 1;
}
//获取实例
vessel.querySubset=function(targetSubset){
	if(this.checkIsConnect()&&this.checkCurCollecion()&&this.checkSubsetExist(targetSubset)){//检查子集是否存在
		for(i=0;i<this.instances.length;i++){
			if(targetSubset==this.instances[i].name){
				return this.instances[i];
			}
		}
		console.log("子集<"+targetSubset+">的实例数据为空!");
		return false;
	}
}
//根据条件获取指定实例
vessel.querySubsetWhere=function(targetSubset,indexVal){
	var instanceRes=this.getTargetInstance(targetSubset,indexVal);
	var resArray=null;//保存查找结果
	if(instanceRes!=null){
		for(i=0;i< instanceRes.length;i++){
			if(resArray==null)resArray=[];
			resArray.push(instanceRes[i][0]);//存入结果对象
		}
	}else{
		console.log("数据实例不存在！");
	}
	return resArray;
}
//更新本地存储
vessel.updateCollections=function (){
	localStorage.setItem("collections",JSON.stringify(this.collections));
}
//更新本地存储
vessel.updateInstances=function (){
	localStorage.setItem("instances",JSON.stringify(this.instances));
}
vessel.checkIsConnect=function(){
	if(!this.isConnect){
		console.log("请先连接数据库！");
		return false;
	}
	return true;
}
vessel.checkCurCollecion=function(){
	//alert(this.curCollection);
	if(this.curCollection==null || this.curCollection=="undefined"){
		console.log("请先选择数据集！");
		return false;
	}
	return true;
}
//检查数据库中子集是否存在
vessel.checkSubsetExist=function(subsetName){
	for(i=0;i<this.curCollection.subsets.length;i++){
		if(subsetName==this.curCollection.subsets[i].name){
			console.log("子集<"+subsetName+">存在！");
			return true;
		}
	}
	console.log("子集<"+subsetName+">不存在！");
	return false;
}