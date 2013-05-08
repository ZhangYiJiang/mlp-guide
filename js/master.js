var Episode = Backbone.DeepModel.extend({
	// Delayed adding the listeners until all episodes have been 
	// added to collections 
	init: function() {
		var continuityData = this.get('continuityData');

		if (continuityData) {
			_.forEach(continuityData.split(' '), function(ep){
				this.set('continuity.' + ep, episodes.get(ep).get('watched'));
				this.listenTo(episodes.get(ep), 'change:watched', this.continuityChange);
			}, this);
		}

		this.listenTo(guide.include, 'add destroy', this.checkFilter);
		this.listenTo(guide.exclude, 'add destroy', this.checkFilter);
		this.listenTo(guide, 'change:search', this.checkFilter);
	}, 

	checkFilter: function() {
		var included = [], excluded = false, search = guide.get('search');

		_.each(this.get('tags'), function(tag){
			if (guide.exclude.has(tag)) {
				excluded = true;
			}

			if (guide.include.has(tag)) {
				included.push(tag);
			}
		});

		if (excluded || (guide.include.length && included.length === 0)) {
			this.view.visibility(false);
			return false;
		}
		
		if (search) {
			var searchRegexp = new RegExp(search, 'i');

			if (this.get('title').match(searchRegexp)) {
				this.view.highlight(search);
			} else {
				this.view.visibility(false);
				return false;
			}
		} else {
			this.view.resetHighlight();
		}

		this.view.visibility(true);
	},

	continuityChange: function(model) {
		this.set('continuity.' + model.id, model.get('watched'));
	}
});

var EpisodeList = Backbone.Collection.extend({
	views: function(func) {
		this.forEach(function(ep){
			func.call(ep.view);
		});
	}, 

	viewsEle: function(func) {
		this.forEach(function(ep){
			func.call(ep.view.el);
		});
	}, 

	season: function(season) {
		return this.filter(function(ep){
			return ep.id.match('s' + season);
		});
	}
});

var SeasonView = Backbone.View.extend({
	initialize: function() {
		this.watchedAll = this.$el.find('.watched-all input');

		this.season = +this.el.id.slice(1);
		this.episodes = episodes.season(this.season);
	}, 

	events: {
		"change .watched-all input":	"checkAll", 
		"change .watched input":		"manageCheckState"
	},

	checkAll: function(evt) {
		var state = this.watchedAll.prop('checked');

		this.episodes.forEach(function(ep){
			ep.view.toggleWatched(state);
		});
	}, 

	manageCheckState: function(evt) {
		// Count the number of episodes watched 
		var watchedEp = _.reduce(this.episodes, function(count, ep) {
			return count + ep.get('watched');
		}, 0);

		if (watchedEp === 0) { // None = clear checkbox
			this.watchedAll.prop({
				indeterminate: false, 
				checked: false
			});
		} else if (watchedEp === this.episodes.length) { // All = check
			this.watchedAll.prop({
				indeterminate: false, 
				checked: true
			});
		} else { // Some = indeterminate state 
			this.watchedAll.prop({
				indeterminate: true, 
				checked: true
			});
		}
	}
});

var EpisodeView = Backbone.View.extend({
	initialize: function() {
		// Cache elements for later use
		this.watched			= this.$el.find('label.watched input');
		this.rememberChoice		= this.$el.find('.remember');
		this.watchEle			= this.$el.find('.watch');
		this.continuityWarning	= this.$el.find('p.warning');
		this.mainAnchor			= this.$el.find('h3 a');

		this.model = new Episode({
			id: this.el.id, 
			title: this.mainAnchor.text(),
			watched: this.watched.prop('checked'), 
			continuityData: this.$el.data('continuity'), 
			tags: this.$el.find('.tag').map(function(){ 
				return {
					'name': this.getAttribute('data-tag'), 
					'category': this.getAttribute('data-category')
				};
			}).get()
		});

		this.model.view = this;

		// Add event handler hooks to the model 
		this.listenTo(this.model, 'change:continuity.*', this.renderContinuity);
	},

	events: {
		"change label.watched input":	"updateWatched", 
		"click h3 a":					"watch", 
		"click label.watched":			"preventPropagation",
		"click span.tag":				"addFilter"
	}, 

	updateWatched: function() {
		this.model.set('watched', this.watched.prop('checked'));
		guide.saveWatched();
	}, 

	toggleWatched: function(watched) {
		this.watched.prop('checked', watched);
		this.watched.change();
	},

	toggleWatchOption: function(visible) {
		this.watchEle.stop(true);

		if (visible) {
			this.watchEle.slideDown(200);
		} else {
			this.watchEle.slideUp(200);
		}
	},

	watch: function(evt) {
		var hasContinuityWarning = _.contains(this.model.get('continuity'), false), 
			hasWatchOption = !! this.mainAnchor.attr('href');

		// Replace state so that the user can come back here next time
		if (history.replaceState) {
			history.replaceState(null, '', '#' + this.el.id);
		} else {
			window.location.hash = this.el.id;
			app.scrollTo(this.el.id, 100);
		}
		

		// Add active class to li 
		episodes.viewsEle(function(){ $(this).removeClass('active'); });
		this.$el.addClass('active');

		// Close any open menus 
		episodes.views(function(){ this.toggleWatchOption(false); });

		// If this episode doesn't have a default view option, 
		// or if there are continuity errors, open up the menu 
		if (!hasWatchOption || hasContinuityWarning) {
			this.toggleWatchOption(true);
		}

		// If this episode has a continuity warning on it, stop the 
		// default view option so that the user has time to read the warning first 
		if (hasWatchOption && hasContinuityWarning && evt) {
			evt.preventDefault();
		}
	}, 
	
	visibility: function(visible) {
		if (visible) {
			this.$el.slideDown(400);
		} else {
			this.$el.slideUp(400);
		}
		
	},

	renderContinuity: function() {
		var continuity = this.model.get('continuity');

		if (continuity && _.contains(continuity, false)) {
			var continuityText = _.chain(continuity)
				.map(function(v, k){ if (!v) { return k; } })
				.compact()
				.value()
				.join(', ')
				.toUpperCase();

			this.continuityWarning.find('.watch-ep').text(continuityText);
			this.continuityWarning.slideDown(100);
		} else {
			this.continuityWarning.slideUp(100);
		}
	}, 

	addFilter: function(evt) {
		var tag = $(evt.target), 
			name = tag.data('tag'), 
			category = tag.data('category');

		guide.include.add({
			name: name, 
			category: category, 
			text: tag.text().replace(/\s*×\s*\d*/g, '')
		});
	},

	highlight: function(term) {
		var originalTitle = this.model.get('title'), 
			replaceRegex = new RegExp('(' + term + ')', 'gi');
		this.mainAnchor.html(originalTitle.replace(replaceRegex, 
			'<span class="title-highlight">$1</span>'));
	}, 

	resetHighlight: function() {
		this.mainAnchor.html(this.model.get('title'));
	},

	preventPropagation: function(evt) {
		evt.stopImmediatePropagation();
	}
});


var FilterTag = Backbone.Model.extend({
	initialize: function() {
		this.view = new FilterTagView({
			model: this
		}); 

		this.view.$el.appendTo(app.includeFilterContainer);
	}
});

var FilterTagView = Backbone.View.extend({
	tagName: 'span', 
	className: 'tag', 

	initialize: function() {
		this.$el.text(this.model.get('text'));
		this.$el.addClass([this.model.get('category'), this.model.get('name')].join(' '));
		$('<span>', {
			'class': 'remove-filter'
		}).appendTo(this.$el);
	}, 

	events: {
		'click span.remove-filter': 'removeFilter'
	}, 

	removeFilter: function(evt) {
		this.model.destroy();
		this.remove();
	}
});

var FilterTagCollection = Backbone.Collection.extend({
	model: FilterTag, 

	has: function (tag) {
		return this.some(function(filter){
			return (filter.get('name') === tag.name && 
				filter.get('category') === tag.category);
		});
	}
});

var Guide = Backbone.DeepModel.extend({
	initialize: function(){
		var watchedEpString = localStorage.getItem('episodesWatched'), 
			watchOption = localStorage.getItem('watchOption');

		this.set('watched', JSON.parse(watchedEpString));

		if (!watchOption) {
			this.set('watchOption', 'none');
		} else {
			this.set('watchOption', watchOption);
		}

		this.include = new FilterTagCollection();
		this.exclude = new FilterTagCollection();
	},

	saveWatched: function() {
		var watched = {};

		episodes.forEach(function(ep){
			watched[ep.id] = ep.get('watched');
		});

		localStorage.setItem('episodesWatched', JSON.stringify(watched));
	}, 

	saveWatchOption: function(className) {
		this.set('watchOption', className);
		localStorage.setItem('watchOption', className);
	}
});




var App = Backbone.View.extend({
	el: $('body'), 

	initialize: function() {
		// Caching elements 
		this.searchInput = this.$el.find('input[type="search"]');
		this.includeFilterContainer = this.$el.find('.include');
		this.excludeFilterContainer = this.$el.find('.exclude');
		this.filterMenu = this.$el.find('.filter-menu');
		this.watchPrefMenu = this.$el.find('.watch-pref-menu');

		this.listenTo(this.model, 'change:watchOption', this.setWatchOption);

		this.setEpisodeWatched();
		this.initTagList();
		this.initWatchPref();
		this.setWatchOption();

		// Open view menu for selected episode 
		if (location.hash) {
			var ep = location.hash.slice(1),
				activeEp = episodes.get(ep).view;

			activeEp.toggleWatchOption(true);
			activeEp.$el.addClass('active');

			_.chain(this.scrollTo)
				.bind(this, ep, 100)
				.defer();
		}
	}, 

	events: {
		'input .search input':			'search', 
		'click .random':				'random', 
		'click .filter-menu li li':		'addFilter', 
		'click .watch-pref-menu li':	'setWatchPref',
		'click nav.top-bar a[class$="button"]': 'preventDefault'
	},

	setEpisodeWatched: function() {
		episodes.forEach(function(ep){
			ep.view.toggleWatched(this.model.get('watched.' + ep.id));
		}, this);
	},

	setWatchPref: function(evt) {
		var ele = $(evt.target), 
			option = ele.data('option');

		guide.saveWatchOption(option);
		ele.addClass('active')
			.siblings().removeClass('active');
	},

	initTagList: function() {
		var tags = {};

		$('.tag').each(function(){
			var t = $(this), 
				category = t.data('category'),
				tag = t.data('tag'), 
				key = category + '.' + tag;

			if (!tags[key]) {
				tags[key] = {
					ele: t.clone(), 
					category: category, 
					count: 1
				};
			} else {
				tags[key].count++;
			}
		});

		this.tags = _.groupBy(tags, function(tag){
			return tag.category;
		});

		this.filterMenu.html(_.template(
			$('#filter-menu-template').html(), 
			{
				'categories': this.tags
			}
		));
	}, 

	initWatchPref: function() {
		var options = $('#s1e01 .watch a').map(function(){
				return {
					'className': this.className, 
					'text': $(this).text()
				};
			}).get();

		options.unshift({
			'className': 'none', 
			'text': 'None - Always show options'
		});

		_.each(options, function(opt) {
			var li = $('<li>', {
				'class': opt.className, 
				'text': opt.text, 
				"data": {
					"option": opt.className
				}
			}).appendTo(this.watchPrefMenu);

			if (opt.className === guide.get('watchOption')) {
				li.addClass('active');
			}
		}, this);
	},

	setWatchOption: function() {
		var className = this.model.get('watchOption');

		if (className === 'none') {
			episodes.forEach(function(ep){ 
				ep.view.mainAnchor.removeAttr('href');
			});
		} else {
			episodes.forEach(function(ep){
				var link = ep.view.$el.find('a.' + className);

				if (link.length) {
					var url = link.prop('href');
					ep.view.mainAnchor.prop('href', url);
				}
			});
		}
	},

	scrollTo: function(ep, duration) {
		// Default duration of 300
		if ( ! _.isNumber(duration) ) duration = 300;

		var scrollPosition = $('#' + ep).offset().top - $('.top-bar').height() - 20;

		// Account for the height of already expanded watch options 
		if ($('.watch:visible').length) {
			scrollPosition -= $('.watch:visible').height();
		}

		$('body, html').animate({
			scrollTop: scrollPosition
		}, duration);
	}, 

	addFilter: function(evt) {
		var tag = $(evt.currentTarget).find('.tag'), 
			name = tag.data('tag'), 
			category = tag.data('category');

		guide.include.add({
			name: name, 
			category: category, 
			text: tag.text().replace(/\s*×\s*\d*/g, '')
		});
	},

	random: function() {
		var r = _.random(episodes.length - 1),
			randomEpisode = episodes.at(r);

		randomEpisode.view.watch();
		app.scrollTo(randomEpisode.id);

		return false;
	},

	search: _.debounce(function() {
		var term = $.trim(this.searchInput.val());
		guide.set('search', term);
	}, 200),

	preventDefault: function(evt) {
		evt.preventDefault();
	}
});

// Initialize 
var episodes = new EpisodeList();

$('.episode-list li').each(function(){
	var epView = new EpisodeView({ el: this });
	episodes.add(epView.model);
});

var seasonViews = $('.season').map(function(){
	return new SeasonView({ el: this });
}).get();

var guide = new Guide(), 
	app = new App({ model: guide });

episodes.forEach(function(ep){ ep.init(); });