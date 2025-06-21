;(function ( window, $) {
	var pumkin = window.pumkin = window.pumkin || {};
	var SITE = window.SITE = window.SITE || {};

	// ON DOC READY
	$(function () {
		
		console.log("=== DOCUMENT READY HANDLER EXECUTED ===");
		
		SITE.initGlobal();

		SITE.initMain();

		// Start the V&A API functionality
		SITE.start();

	});

})( this, this.jQuery );