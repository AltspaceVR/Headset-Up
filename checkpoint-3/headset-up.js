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

function parseCategories(cats)
{
	return cats.split(';').map(function(cat){
		return cat.trim().split('.');
	});
}

function formatTime(ms)
{
	if(ms <= 0)
		return '00:00';

	var seconds = Math.ceil(ms/1000);
	var minutes = Math.floor(seconds / 60);
	seconds = seconds % 60;
	if(minutes < 10) minutes = '0'+minutes;
	if(seconds < 10) seconds = '0'+seconds;

	return minutes + ':' + seconds;
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

AFRAME.registerComponent('timer', {
	multiple: true,
	schema: {
		duration: {type: 'number', default: 30},
		on: {type: 'string', default: null},
		emit: {type: 'string', default: 'timerend'},
		label: {type: 'selector', default: null},
		autostart: {type: 'boolean', default: false}
	},
	init: function()
	{
		this.endTime = 0;
		this.lastUpdate = 0;

		if(this.data.on){
			this.el.addEventListener(this.data.on, this.start.bind(this));
		}

		if(this.data.autostart)
			this.start();
	},
	tick: function(time, deltaTime)
	{
		if(!this.endTime) return;

		var label = this.el.hasAttribute('n-text') ? this.el : this.data.label;
		var nowTime = performance.now();

		if(label && nowTime - this.lastUpdate > 250){
			label.setAttribute('n-text', 'text', formatTime(this.endTime - nowTime));
			this.lastUpdate = nowTime;
		}

		if(this.endTime > 0 && nowTime > this.endTime){
			this.el.emit(this.data.emit);
			this.stop();
			if(label)
				label.setAttribute('n-text', 'text', '00:00');
		}
	},
	start: function(){
		this.endTime = performance.now() + Math.floor(this.data.duration * 1000);
	},
	stop: function(){
		this.endTime = 0;
	},
	running: function(){
		return this.endTime !== 0;
	}
});

AFRAME.registerComponent('display-phrase', {
	dependencies: ['json', 'n-text'],
	schema: {type: 'array'},
	init: function()
	{
		this.el.addEventListener('timerend', (function(){
			this.el.setAttribute(this.name, []);
		}).bind(this));
	},
	update: function()
	{
		var phrase = getDeepValue(this.el.json, this.data, '');
		if(this.data.length > 0 && phrase){
			this.el.setAttribute('n-text', 'text', phrase);
			var target = document.querySelector('.hud[timer]');
			if(!target.components.timer.running())
				target.components.timer.start();
		}
		else {
			this.el.setAttribute('n-text', 'text', 'Ready to play?');
		}
	}
});

AFRAME.registerComponent('advance-phrase', {
	schema: {
		on: {type: 'string', default: 'click'}
	},
	init: function()
	{
		this.advanceQuestion = this._advanceQuestion.bind(this);
		this.el.addEventListener(this.data.on, this.advanceQuestion);
	},
	initCategories: function()
	{
		function sum(acc, val){
			return acc + val;
		}

		this.target = document.querySelector('.hud[json][display-phrase]');
		var catString = this.el.sceneEl.dataset.categories;
		this.catPaths = parseCategories(catString);

		// pretend the categories are all in one long array
		// this array stores the first index of each category in that array
		this.catOffsets =
			this.catPaths
			.map(function(name){
				return getDeepValue(this.target.json, name, []).length;
			}, this)
			.map(function(length, i, array){
				return array.slice(0, i+1).reduce(sum, 0);
			});

		// the first item in the offsets list is always zero
		this.catOffsets.unshift(0);
	},
	remove: function(){
		this.el.removeEventListener(this.data.on, this.advanceQuestion);
	},
	_advanceQuestion: function()
	{
		if(!this.target || !this.catPaths || !this.catOffsets){
			this.initCategories();
		}

		var totalLength = this.catOffsets[this.catOffsets.length-1];
		var newQTotalIndex = Math.floor( Math.random() * totalLength );

		// find the category that the randomly chosen index falls in
		var catIndex = this.catOffsets.findIndex( function(el, i, array){
			return newQTotalIndex >= el && newQTotalIndex < array[i+1];
		});

		// create a copy of the category path
		var newQPath = this.catPaths[catIndex].slice();
		newQPath.push( newQTotalIndex - this.catOffsets[catIndex] );

		// update the question id with the new name
		this.target.setAttribute('display-phrase', newQPath);
	}
});
