'use strict';

function getDeepValue(obj, pathsArray, defaultValue)
{
	if(pathsArray.length == 0)
		return obj;
	else if(!(obj instanceof Object) || obj[pathsArray[0]] === undefined)
		return defaultValue;
	else
		return getDeepValue(obj[pathsArray[0]], pathsArray.slice(1), defaultValue);
}

function parseCategories(cats)
{
	return cats.split(';').map(function(cat){
		return cat.trim().split('.');
	});
}

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

AFRAME.registerComponent('hu-question-id', {
	dependencies: ['json', 'n-text'],
	schema: {type: 'array'},
	update: function(){
		var phrase = getDeepValue(this.el.json, this.data, '');
		this.el.setAttribute('n-text', 'text', phrase);
	}
});

AFRAME.registerComponent('hu-next-question', {
	schema: {
		target: {type: 'selector'},
		on: {type: 'string', default: 'click'}
	},
	init: function()
	{
		var catString = this.el.sceneEl.dataset.categories;
		this.catNames = parseCategories(catString);
		this.catLengths = this.catNames.map(function(name){
			return getDeepValue(this.data.target.json, name, []).length;
		}, this);

		this.advanceQuestion = this._advanceQuestion.bind(this);
		this.el.addEventListener(this.data.on, this.advanceQuestion);
	},
	remove: function(){
		this.el.removeEventListener(this.data.on, this.advanceQuestion);
	},
	_advanceQuestion: function()
	{
		function sum(acc, val){
			return acc + val;
		}

		var totalLength = this.catLengths.reduce(sum, 0);
		var newQIndex = Math.floor( Math.random() * totalLength );

		// find the category that the randomly chosen index falls in
		var catIndex = this.catLengths.findIndex( function(el, i, array){
			return newQIndex >= array.slice(0, i).reduce(sum, 0)
				&& newQIndex < array.slice(0, i+1).reduce(sum, 0);
		});

		// create a copy of the category name
		var newQName = this.catNames[catIndex].slice();

		// compute index of the random item in that category
		var newQCatOffset = this.catLengths.slice(0, catIndex).reduce(sum, 0);
		newQName.push( newQIndex - newQCatOffset );

		// update the question id with the new name
		this.data.target.setAttribute('hu-question-id', newQName);
	}
});
