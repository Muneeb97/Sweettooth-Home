var preloadSlides = 3;                // Number of slides to preload before showing gallery     
var swipeXThreshold = 30;             // X-axis minimum threshold for swipe action (in px) 
var swipeYThreshold = 90;             // Y-axis maximum threshold for swipe action (in px)                
var currentSlideOpacity = 1.0;        // Opacity of the current (centre) slide
var backgroundSlideOpacity = 0.5;     // Opacity of the slides either side of the current slide
var slideHorizMargin = 0;             // Number of pixels either side of each slide
var buttonHeight = 0;                 // Temporary store for the button heights
var currentSlide = 0;                 // The slide that the user is currently viewing
var totalSlides = 0;                  // Total number of slides in the gallery
var slides = new Array();             // Holds jQuery objects representing each slide image
var slideWidths = new Array();        // Holds the widths (in pixels) of each slide
var slideLoaded = new Array();        // True if the given slide image has loaded
var loading = true;                   // True if we're still preloading images prior to displaying the gallery

$( init );


// Set up the gallery once the document is ready

function init() {

  // Grab the horizontal margin between slides for later calculations
  slideHorizMargin = parseInt( $('#gallery img').css('margin-left') );

  // Hide the gallery and left/right buttons
  $('#gallery').fadeTo( 0, 0 );
  $('#gallery').css('top','-999em');
  buttonHeight = $('#leftButton').css('height');
  $('#leftButton').css('height',0);
  $('#rightButton').css('height',0);


  // Bind the handleSlideLoad() handler function to each slide's load event
  $('#gallery img').load( handleSlideLoad );

  $('#gallery img').each( function() {
    $(this).hide();
    $(this).data( 'slideNum', totalSlides );
    slides[totalSlides++] = $(this);
    if ( this.complete ) $(this).trigger("load");
    $(this).attr( 'src', $(this).attr('src') );
  } );

  // Re-centre the current slide whenever the user resizes the browser
  $(window).resize( centreCurrentSlide ); 

  // Set the initial show/hide states of the left and right buttons
  setButtonStates();


  // Bind the moveRight() and moveLeft() functions to
  // the swipeLeft and swipeRight events respectively.
  // (IE chokes on the swipe plugin, so skip this code on IE)

  if ( !$.browser.msie ) {

    $('#gallery').swipe( {
         swipeLeft: moveRight,
         swipeRight: moveLeft,
         threshold: { x:swipeXThreshold, y:swipeYThreshold }
    } );
  }

  // Show/hide the tutorial info message when touched (for touch devices)
  $('#info').bind( 'touchstart', function() { $(this).toggleClass('hover'); } );
}


// Process each slide once it's finished loading

function handleSlideLoad() {

  // Record the slide's width in the slideWidths array
  slideWidths[$(this).data('slideNum')] = $(this).width();

  // Increase the gallery div's width to encompass this newly-loaded slide
  $('#gallery').width( $('#gallery').width() + $(this).width() + slideHorizMargin*2 );

  // Record the fact that this slide has loaded in the slideLoaded array
  slideLoaded[$(this).data('slideNum')] = true;

  // Are we still preloading the slides?

  if ( loading ) {

    // Yes: Calculate how many slides we've now preloaded

    var preloaded = 0;

    for ( var i=0; i < preloadSlides; i++ ) {
      if ( slideLoaded[i] ) preloaded++;
    }

    // If we've preloaded enough slides, fade in the gallery and enable the left/right buttons

    if ( preloaded == preloadSlides || preloaded == totalSlides ) {
      $('#loading').clearQueue().stop().fadeTo('slow', 0 );
      $('#gallery').css('top',0);
      $('#gallery').fadeTo('slow', 1 );
      $('#leftButton').css('height',buttonHeight);
      $('#rightButton').css('height',buttonHeight);
      $('#rightButton').show();
      addSlideHover();
      loading = false;
    }
  }

  // If this newly-loaded slide is the first slide in the gallery,
  // centre it in the browser viewport and set its opacity to currentSlideOpacity.
  // Otherwise, set its opacity to backgroundSlideOpacity.

  if ( $(this).data('slideNum') == 0 ) {
    centreCurrentSlide();
    $(this).fadeTo( 'slow', currentSlideOpacity );
  } else {
    $(this).fadeTo( 'slow', backgroundSlideOpacity );
  }

}


// Move one slide to the left by sliding the gallery left-to-right

function moveLeft() {

  // Don't move if this is the first slide, or if we don't yet have a width for the previous slide
  if ( currentSlide == 0 ) return;
  if ( slideWidths[currentSlide-1] == undefined ) return;

  // Cancel all event handlers on the current slide
  slides[currentSlide].unbind('mouseenter').unbind('mouseleave').unbind('touchstart');


  // Slide the whole gallery right so that the previous slide is now centred
  var offset = slideWidths[currentSlide]/2 + slideHorizMargin*2 + slideWidths[currentSlide-1]/2;
  $('#gallery').animate( { left: '+=' + offset } );

  // Fade the old slide to backgroundSlideOpacity, and the new slide to currentSlideOpacity
  slides[currentSlide].animate( { opacity: backgroundSlideOpacity } );
  slides[currentSlide-1].animate( { opacity: currentSlideOpacity } );

  // Update the current slide index
  currentSlide--;

  // Update the shown/hidden states of left/right buttons as appropriate
  setButtonStates();

}


// Move one slide to the right by sliding the gallery right-to-left

function moveRight() {

  // Don't move if this is the final slide, or if we don't yet have a width for the next slide
  if ( currentSlide == totalSlides - 1 ) return;
  if ( slideWidths[currentSlide+1] == undefined ) return;

  // Cancel all event handlers on the current slide
  slides[currentSlide].unbind('mouseenter').unbind('mouseleave').unbind('touchstart');

  // Slide the whole gallery left so that the next slide is now centred
  var offset = slideWidths[currentSlide]/2 + slideHorizMargin*2 + slideWidths[currentSlide+1]/2;
  $('#gallery').animate( { left: '-=' + offset } );

  // Fade the old slide to backgroundSlideOpacity, and the new slide to currentSlideOpacity
  slides[currentSlide].animate( { opacity: backgroundSlideOpacity } );
  slides[currentSlide+1].animate( { opacity: currentSlideOpacity } );

  // Update the current slide index
  currentSlide++

  // Update the shown/hidden states of left/right buttons as appropriate
  setButtonStates();

}


// Centre the current slide horizontally in the viewport

function centreCurrentSlide() {

  // Work out how far the left edge of the slide is from the
  // left hand edge of the gallery div

  var offsetFromGalleryStart = 0;

  for ( var i=0; i<currentSlide; i++ ) {
    offsetFromGalleryStart += slideWidths[i] + slideHorizMargin*2;
  }

  // Find the horizontal centre of the browser window
  var windowCentre = $(window).width() / 2;

  // Compute the left position of the slide based on the window centre and slide width
  var slideLeftPos = windowCentre - ( slideWidths[currentSlide] / 2 );

  // Compute the offset for the gallery div based on the slide position and
  // the slide offset from the gallery start. Also allow for the
  // horizontal margin on the left side of the slide.
  var offset = slideLeftPos - offsetFromGalleryStart - slideHorizMargin;

  // Move the gallery div to the new offset
  $('#gallery').css( 'left', offset );
}


// Show or hide the left and right buttons depending on the current slide:

function setButtonStates() {

  if ( currentSlide == 0 ) {
    $('#leftButton').hide();
  } else {
    $('#leftButton').show();
  }

  if ( currentSlide == totalSlides - 1 ) {
    $('#rightButton').hide();
  } else {
    $('#rightButton').show();
  }

}

// Attach mouseenter and mouseleave event handlers to the current slide to fade the caption in and out
// However, if the device supports touch events then fade the caption in/out when the slide is touched

function addSlideHover() {

  if ( 'ontouchstart' in document.documentElement ) {
    slides[currentSlide].bind( 'touchstart', function() {
      if ( $('#caption').is(':visible') ) {
        $('#caption').stop().clearQueue().fadeOut( captionSpeed );
      } else {
        $('#caption').stop().clearQueue().fadeTo( captionSpeed, captionOpacity );
      }
    } );
  } else {
    slides[currentSlide].hover(
      function() { $('#caption').stop().fadeTo( captionSpeed, captionOpacity ) },
      function() { $('#caption').stop().fadeTo( captionSpeed, 0 ) }
    );
  }
}

