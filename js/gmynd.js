window.Gmynd = {

	container: 'body',

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
			this.init( params );
			this.set( params );
		},
		ellipse: function( params ) {
			this.init( params );
			params['border-radius'] = "50%";
			this.set( params );
		},
		freeform: function( params ) {
			this.init( params );
			var canv = $( '<canvas></canvas>' );
			new Processing( canv[0], params.drawCode );
			this.elem.css({ background:'transparent' });
			this.set( params );
			this.elem.append( canv );
		}
	},

	// All Gmynd.shape objects will inherit these properties
	BaseObject: function() {
		this.init = function( params ) {
			this.elem = $('<div></div>');
			this.properties = {};
			this.children = [];
			$( Gmynd.container ).append( this.elem );
			this.elem.css({ 'position':'absolute', 'background':'#333' });
			if ( params.text ) {
				this.elem.css({ 'text-align':'center', 'color':'#fff' }).text( params.text );
			}
			return this;
		};
		this.on = function( event, handler ) {
			$( this.elem ).on( event, handler );
			return this;
		};
		this.set = function( params ) {
			var self = this;
			if ( params.children ) {
				_.each( params.children, function( item ) {
					item.appendTo( self.elem );
				});
				_.extend( this.children, params.children );
			}
			this.elem.css( Gmynd.cssMap( params, this ));
			_.extend( this.properties, params );
		};
		this.get = function( key ) {
			return this.properties[key];
		};
		this.appendTo = function( target ) {
			if ( target.elem ) {
				this.elem.appendTo( target.elem );
			} else {
				this.elem.appendTo( $( target ) );
			}
			return this;
		};
		this.append = function( item ) {
			if ( item.elem ) {
				item.appendTo( this );
			} else {
				this.elem.append( item );
			}
			return this;
		};
		this.remove = function() {
			this.elem.remove();
			return this;
		}
	}, // end BaseObject

	// Collections
	CreateCollection: function( num, fn ) {
		var col = [];
		for ( var i=0; i<num; i++ ) {
			col.push( fn( i ) );
		};
		return Gmynd.CreateShape( 'rect', { children:col, background:'none' });
	},

	// Basic setup
	setup: function( container ) {
		if ( !container ) { container = $( 'body' ) }
		Gmynd.container = $( container );
		Gmynd.globalize(["Objects", "Initialize", "CreateShape", "Every", "After", "CreateCollection", "Calculate"]);
		_.each( Gmynd.shapes, function( item ) {
			item.prototype = new Gmynd.BaseObject;
		});
		Gmynd.defaultStyles();
		console.log( "GMYND has loaded successfully!" );
	},

	defaultStyles: function() {
		$( Gmynd.container ).css({
			'-webkit-perspective':'800px',
			'-moz-perspective':'800px',
			'-ms-perspective':'800px',
			'-o-perspective':'800px',
			'perspective':'800px'
		});
	},

	// Attach some functions of Gmynd to the window for easy access
	globalize: function( funcNames ) {
		_.each( funcNames, function( item ) {
			window[item] = Gmynd[item];
		});
	},

	// Map numeric properties to css values
	cssMap: function( properties, obj ) {
		// List of transformations (e.g. "Add px to dimensions")
		var transformString = "";
		var maps = [
			{	// Positions and dimensions
				keys: ["width", "height", "border-width", "left", "top", "bottom", "right"],
				transform: function( item, key, list ) { list[key] = item + 'px' }
			},
			{
				keys: ["translate", "translateZ", "translate3d", "rotate", "rotateX", "rotateY", "scale"],
				transform: function( item, key, list ) {
					if ( _.include( ["rotate", "rotateX", "rotateY"], key ) ) {
						transformString += " "+key+"("+item+"deg)";
					} else if ( key === "scale") {
						transformString += " scale("+item+")";
					} else if ( key === "translateZ" ) {
						transformString += " translateZ("+item+"px)";
					} else if ( key === "translate" ) {
						transformString += " translate("+item.x+"px, "+item.y+"px)";
					} else if ( key === "translate3d" ) {
						transformString += " translate3d("+item.x+"px, "+item.y+"px, "+item.z+"px)";
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
		if ( !result.transform && transformString !== "" ) {
			result.transform = transformString;
		}

		// check if the element should be centered
		if ( properties.centered === true || (properties.centered!==false && obj.centered===true) ) {
			var w, h;
			w = -obj.elem.width()/2;
			h = -obj.elem.height()/2;
			if ( properties.width ) {
				w = -properties.width/2;
			}
			if ( properties.height ) {
				h = -properties.height/2;	
			}
			result['margin'] = h + "px 0 0 " + w + "px";
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
			return window[fn]( function() {
				self.count++;
				callback( self.count );
			}, self.delay );
		}
		this.seconds = function( callback ) {
			return window[fn]( function() {
				self.count++;
				callback( self.count );
			}, self.delay*1000 );
		}
	},
	Every: function( amount ) {
		return new Gmynd.TimedEvent( amount, 'setInterval' );
	},
	After: function( amount ) {
		return new Gmynd.TimedEvent( amount, 'setTimeout' );
	},

	Calculate: {
		constrain: function( val, min, max ) {
			return Math.min( Math.max( val, min ), max);
		},
		dist: function( x1, y1, x2, y2 ) {
			return Math.sqrt( Math.pow( x1-x2, 2 ) + Math.pow( y1-y2, 2 ) );
		},
		lerp: function( min, max, amount ) {
			return min + ( max - min ) * amount;
		},
		map: function( val, fromMin, fromMax, toMin, toMax ) {
			return ( val-fromMin ) / ( fromMax-fromMin ) * ( toMax-toMin ) + toMin;
		},
		mag: function( x, y, z ) {
			if ( z == undefined) return Math.sqrt( x*x + y*y);
			return Math.sqrt( x*x + y*y + z*z);
		},
		random: function( val1, val2 ) {
			if ( val1 == undefined ) return Math.random();
			if ( val2 == undefined ) return Math.random() * val1;
			return Math.random() * ( val2 - val1 ) + val1;
		}
	}

};