'use strict';

AFRAME.registerComponent('json', {
	schema: {type: 'src'},
	init: function(){
		this.el.json = {};
	},
	update: function(){
		try {
			this.el.json = JSON.parse(THREE.Cache.files[this.data]);
		}
		catch(e){
			console.error('Unable to parse', this.data);
		}
	}
});

function getDeepValue(obj, pathsArray, defaultValue)
{
	if(pathsArray.length == 0)
		return obj;
	else if(!(obj instanceof Object) || obj[pathsArray[0]] === undefined)
		return defaultValue;
	else
		return getDeepValue(obj[pathsArray[0]], pathsArray.slice(1), defaultValue);
}

AFRAME.registerComponent('hu-question-id', {
	dependencies: ['json', 'n-text'],
	schema: {type: 'array'},
	update: function(){
		var phrase = getDeepValue(this.el.json, this.data, '');
		this.el.setAttribute('n-text', 'text', phrase);
	}
});
