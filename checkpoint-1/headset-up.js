'use strict';

function getDeepValue(obj, pathArray, defaultValue)
{
	if(pathArray.length == 0)
		return obj;
	else if(!(obj instanceof Object) || obj[pathArray[0]] === undefined)
		return defaultValue;
	else
		return getDeepValue(obj[pathArray[0]], pathArray.slice(1), defaultValue);
}

AFRAME.registerComponent('json', {
	schema: {type: 'selector'},
	init: function(){
		this.el.json = {};
	},
	update: function(){
		try {
			this.el.json = JSON.parse(this.data.data);
		}
		catch(e){
			console.error('Unable to parse', this.data.data);
		}
	}
});

AFRAME.registerComponent('display-phrase', {
	dependencies: ['json', 'n-text'],
	schema: {type: 'array'},
	update: function()
	{
		var phrase = getDeepValue(this.el.json, this.data, '');
		if(this.data.length > 0 && phrase){
			this.el.setAttribute('n-text', 'text', phrase);
		}
		else {
			this.el.setAttribute('n-text', 'text', 'Ready to play?');
		}
	}
});
