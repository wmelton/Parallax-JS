// location.replace( '#id' ) -- changes hash URI without history state

$(function(){
	var     $window = $( window )
	  ,       $body = $( 'body' )
	  ,    $content = $( '#content' )
	  ,   $sections = $content.find( 'section' )
	  ,   $scroller = $( '#mock-scroller' )
	  , fScrPercent = 0
	  ,  aAnimProps = [ 'opacity', 'left', 'top', 'width', 'height', 'background-position' ]
	  , iAnimTimeout, iWindowHeight, aAnimations
	  ;

	// find all animatable nodes and store properties
	$sections.each( function( ix ){
		var $sec = $sections.eq( ix );
		$sec.data( '$pNodes' , $sec.find( '.animate' ) );
		$sec.data( 'bSection', true );

		$sec.add( $sec.data( '$pNodes' ) ).each( function(){
			var $this = $( this )
			  , oData = $this.data()
			  ;

			oData.iPause    = 0 | $this.attr( 'anim-pause' );
			oData.bDetached = !!~'1 true'.indexOf( $this.attr( 'anim-detached' ) );
			oData.fSpeed    = parseFloat( $this.attr( 'anim-speed' ) ) || 1;
			oData.onFocus   = $this.attr( 'anim-focus-handler' );
			oData.onBlur    = $this.attr( 'anim-blur-handler' );
		} );

		// remove the section from the DOM
		$sec.detach();
	} );

	// converts a unit string to px
	function parseUnit( vVal, $node, sValFn ){
		var  aVal = /(-?\d+)(.*)/.exec( vVal )
		  , fUnit = parseFloat( aVal[ 1 ] )
		  , sUnit = aVal[ 2 ]
		  ;

		switch( sUnit ){
			case '':
			case 'px':
				return fUnit;

			case '%':
				return $node[ sValFn ]()  * fUnit / 100;

			default:
				throw new Error( 'Unexpected unit type: ' + sUnit );
				return;
		}
	}

	function readCSSProps( $node, sClass ){
		var oObj = {}
		  , i, l, vPropVal, sProp
		  ;

		$node.removeClass( 'start to end' ).addClass( sClass );

		for( i=0, l=aAnimProps.length; i<l; i++ ){
			sProp = aAnimProps[i];
			switch( sProp ){
				// numeric css
				case 'opacity':
					vPropVal = 0 | $node.css( sProp );
					break;

				// numeric position
				case 'left':
				case 'top':
					vPropVal = $node.position()[ sProp ];
					break;

				// numeric size
				case 'width':
				case 'height':
					vPropVal = $node[ 'outer' + sProp.substr( 0, 1 ).toUpperCase() + sProp.substr( 1 ) ]();
					break;

				// split numeric properties
				case 'background-position':
					vPropVal = $node.css( sProp ).split( ' ' );
					vPropVal[0] = parseUnit( vPropVal[0], $node, 'outerWidth'  );
					vPropVal[1] = parseUnit( vPropVal[1], $node, 'outerHeight' );
					break;
			}

			oObj[ sProp ] = vPropVal;
		}

		return oObj;
	}

	function eq( vVal1, vVal2 ){
		var i, l;

		if( vVal1 === vVal2 ){ return true; }
		if( typeof vVal1 !== typeof vVal2 ){ return false; }

		if( vVal1.length && vVal1.splice && vVal2.length && vVal2.splice ){
			if( vVal1.length != vVal2.length ){ return false; }

			for( i=0, l=vVal1.length; i<l; i++ ){
				if( !eq( vVal1[i], vVal2[i] ) ){
					return false;
				}
			}

			return true;
		}

		return false;
	}

	function propDiff( oProps1, oProps2 ){
		var oDiff = {}
		  , n, bProp;

		for( n in oProps2 ){
			if( !eq( oProps1[n], oProps2[n] ) ){
				oDiff[n] = bProp = [ oProps1[n], oProps2[n] ];
			}
		}

		return bProp && oDiff;
	}

	function addDiffAnimation( $node, iTop, iStage, iStartStage ){
		if( null == iStartStage ){ iStartStage = iStage - 1; }

		var      stages = [ 'start', '', 'to', 'end' ]
		  ,   sEndStage = stages[ iStage ]
		  ,   oPropsEnd = readCSSProps( $node, sEndStage )
		  , oPropDiff
		  ;

		// get the diff between this stage and the most recent prior one with a change
		//while( !( 
			oPropDiff = propDiff( readCSSProps( $node, stages[ iStartStage ] ), oPropsEnd );
		//) && iStartStage-- );

		if( !oPropDiff ){ return 0; }

		console.log( oPropDiff, sEndStage, iStartStage );
	}

	// window loaded or re-sized, re-calculate all dimensions
	function measureAnimations(){
		var        iTop = 0
		  , iStartTimer = +new Date()
		  ;

		aAnimations = [];
		$scroller.css( 'height', 10000 );

		$sections.each( function( ix ){
			var       $sec = $( this )
			  ,      oData = $sec.data()
			  ,    $pNodes = oData.$pNodes
			  , iSecHeight = 0
			  ,  iMaxPause = 0
			  , i, l, iAnimSize, $pNode
			  ;

			oData.startsAt = iTop;

			// append section to content and reset position
			$sec
				.css({ top : '' })
				.appendTo( $content );

			if( ix ){
				iSecHeight = addDiffAnimation( $sec, iTop, 1 );
			}

			for( i=0, l=$pNodes.length; i<l; i++ ){
				$pNode = $pNodes.eq( i );
				iMaxPause = Math.max(
					  oData.iPause
					,             addDiffAnimation( $pNode, iTop                         , 1 )
					, iAnimSize = addDiffAnimation( $pNode, iTop + iSecHeight            , 2 )
					,             addDiffAnimation( $pNode, iTop + iSecHeight + iAnimSize, 3 )
				);
			}

			addDiffAnimation( $sec, iTop + iSecHeight, 2 );
			addDiffAnimation( $sec, iTop + iSecHeight, 3 );

			$sec.detach();

			oData.endsAt = iTop += iSecHeight;
		} );

		console.log( 'measurements took ' + ( new Date() - iStartTimer ) + 'ms' )
	}

	function onResize(){
		measureAnimations();
		onScroll();
	}

	function onScroll(){
		
	}

	$window
		/**
		 * On resize:
		 * 
		 * - save window height for onscroll calculations
		 * - re-calculate the height of all the <section> elements
		 * - adjust top position so that it's at the same %, not same px
		 **/
		.bind( 'resize', function(){
			if( iAnimTimeout ){ clearTimeout( iAnimTimeout ); }
			iAnimTimeout = setTimeout( onResize, 50 );

			iWindowHeight = $window.height();
		})
		.trigger( 'resize' )
		.bind( 'scroll', onScroll );
});