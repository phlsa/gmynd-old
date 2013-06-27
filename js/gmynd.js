window.Gmynd = {

	// Setup objects
	Objects: {},
	Initialize: function( objects ) {
		_.extend( Gmynd.Objects, objects );
	},

	// Create any shape
	CreateShape: function( type, params ) {
		return new Gmynd.shapes[type]( params );
	},

	// Basic shapes
	shapes: {
		rect: function( params ) {
			this.set( params );
		},
		ellipse: function( params ) {
			params['border-radius'] = "50%";
			this.set( params );
		}
	},

	// All Gmynd.shape objects will inherit these properties
	BaseObject: function() {
		this.elem = $('<div></div>');
		this.elem.css({ 'position':'absolute' });

		this.on = function( event, handler ) {
			$( this.elem ).on( event, handler );
		};
		this.set = function( params ) {
			this.elem.css( Gmynd.cssMap( params ));
			_.extend( this, params );
		};

		$( 'body' ).append( this.elem );
	},

	// Basic setup
	setup: function() {
		Gmynd.globalize(["Objects", "Initialize", "CreateShape", "Every"]);
		_.each( Gmynd.shapes, function( item ) {
			item.prototype = new Gmynd.BaseObject;
		});
		console.log( "GMYND has loaded successfully!" );
	},

	// Attach some functions of Gmynd to the window for easy access
	globalize: function( funcNames ) {
		_.each( funcNames, function( item ) {
			window[item] = Gmynd[item];
		});
	},

	// Map numeric properties to css values
	cssMap: function( properties ) {
		// List of transformations (e.g. "Add px to dimensions")
		var transformString = "";
		var maps = [
			{	// Positions and dimensions
				keys: ["width", "height", "border-width", "left", "top", "bottom", "right"],
				transform: function( item, key, list ) { list[key] = item + 'px' }
			},
			{
				keys: ["translate", "rotate", "scale"],
				transform: function( item, key, list ) {
					if ( key === "rotate" ) {
						transformString += " rotate("+item+"deg)";
					} else if ( key === "scale" ) {
						transformString += " scale("+item+")";
					}
				}
			}
		]

		var result = {};
		_.each( properties, function( item, key ) {
			var found = false;
			_.each( maps, function( mapItem ) {
				if ( _.contains( mapItem.keys, key) ) {
					mapItem.transform( item, key, result );
					found = true;
				}
			});
			// simply add all other elements unfiltered
			if ( !found ) {
				result[key] = item;
			}
		});

		// apply transformation if there is none
		if ( !result.transform ) {
			result.transform = transformString;
		}
		return result;
	}, // END cssMap

	// Timed Functions
	TimedEvent: function( delay, fn ) {
		var self = this;
		this.count = 0;
		this.fn = fn;
		this.delay = delay;
		this.milliseconds = function( callback ) {
			return window.setInterval( function() {
				self.count++;
				callback( self.count );
			}, self.delay );
		}
		this.seconds = function( callback ) {
			return window.setInterval( function() {
				self.count++;
				callback( self.count );
			}, self.delay*1000 );
		}
	},
	Every: function( amount ) {
		return new Gmynd.TimedEvent( amount, window.setInterval );
	}
};