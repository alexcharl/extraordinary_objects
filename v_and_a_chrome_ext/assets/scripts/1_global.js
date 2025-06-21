;(function ( window, $, Modernizr ) {
	
	var pumkin = window.pumkin;
	var SITE = window.SITE = window.SITE || {};

	function initGlobal () {
		var gv;
		gv = window.gv = {
			$window: $(window),
			$document: $(document),
			$html: $('html'),
			$body: $('body'),
			WIDTH: $(window).width(),
			HEIGHT: $(window).height(),
			deviceVariables: pumkin.defineDeviceVariables(),
			browser: pumkin.browserDetection(),
			
			// site specific
			$wrapper: $('#wrapper')
		};

		console.log('initGlobal');
		
	}

	// EXPORT
	SITE.initGlobal = initGlobal;


})( this, this.jQuery, this.Modernizr );