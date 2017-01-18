GAME_OVER     = true;
GAME_SCORE    = 0;

/////////////////////////////////////////////////////////////////////////////////////////////////// utilities
// extends Array
Array.prototype.remove = function(el) {
	var index = this.indexOf(el);
	if( index == -1 ) return false;
	this.splice(index, 1);
	return this;
}
// extends remove method for IE
if( typeof Element.prototype.remove == 'undefined' ) {
	Element.prototype.remove = function() {
		this.parentNode.removeChild(this);
	}
}
// load attributes from super class
Object.prototype.super = function(x, y) {
	var c = this.constructor;
	this.x = x ? x : c.x;
	this.y = y ? y : c.y;
	this.speed = c.speed;
	this.image = document.getElementById(c.image);
	this.width = this.image.width;
	this.height = this.image.height;
	this.half = this.width/2;
}
// get current time
function time() {
	return new Date().getTime();
}
// return the elapsed time from the last call
function TIMER() {
	var now = time(),
		elapsed = now - TIMER.last;
	TIMER.last = now;
	return elapsed;
}
TIMER.last = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////// WARSHIP

function WARSHIP() {
	this.super();
	var self = this;
	// desktop keyboard events
	window.addEventListener('keydown', function(e) {
		WARSHIP.key[e.keyCode] = true;
		// fire
		if( e.keyCode == 90 ) self.fire();
	});
	window.addEventListener('keyup', function(e) {
		WARSHIP.key[e.keyCode] = false;
	});
	// for mobile
	window.addEventListener('touchstart', function(e) {
		LAST_TOUCH = e.touches[0].clientX;
		// tap
		IS_TAP = true;
	});
	window.addEventListener('touchmove', function(e) {
		// cancel tap event
		IS_TAP = false;
		// move warship
		var x = e.touches[0].clientX;
		self.x += (x-LAST_TOUCH);
		LAST_TOUCH = x;
	});
	window.addEventListener('touchend', function(e) {
		if( IS_TAP ) self.fire();
	});
}
// move warship on keydown
WARSHIP.prototype.loop = function() {
	// dispatch
	if( WARSHIP.key[37] ) {
		this.x -= WARSHIP.speed; 
		this.x = this.x > 0 ? this.x : 0;
	}
	if( WARSHIP.key[39] ) {
		this.x += WARSHIP.speed; 
		this.x = this.x < STAGE_WIDTH ? this.x : STAGE_WIDTH;
	}
	stage.drawImage(this.image, this.x - this.half, this.y);
}
// fire!
WARSHIP.prototype.fire = function() {
	new BULLET(this.x);
}
// put the warship to its initial position
WARSHIP.prototype.init = function() {
	this.x = WARSHIP.x;
}
// static var
WARSHIP.x = 240;
WARSHIP.y = 395;
WARSHIP.image = 'warship';
WARSHIP.key   = {37: false, 39: false, 90: false}; // save currently pressed key

////////////////////////////////////////////////////////////////////////////////////////////////// UFO

function UFO(x) {
	// private var
	this.super(x);
	// cache the left & right border of this ufo
	this.left = x - this.half;
	this.right = x + this.half;
	// append
	UFO.list.push(this);
}
// instance methods
// main loop
UFO.prototype.loop = function(elapsed) {
	this.y += UFO.speed * elapsed / 1000;
	// check if current ufo has hit the earth
	if( this.y < STAGE_HEIGHT-120 ) {
		stage.drawImage(this.image, this.left, this.y);
	} else { 
		this.destroy();
		// hit the earth
		earth.hit();
	}
}
// hit by player
UFO.prototype.hit = function() {
	// incr score
	GAME_SCORE++;
	// call self-destroy
	this.destroy();
}
// destroy
UFO.prototype.destroy = function() {
	UFO.list.remove(this);
	delete this;
}
// static vars
UFO.y = -80;
UFO.image = 'ufo';
UFO.list  = [];   // array which contains all current ufos
UFO.n     = null; // the new ufo generating interval
// static methods
UFO.g = function() { // generate new ufo
	if( Math.random() > UFO.rate ) return;
	new UFO(Math.floor(Math.random()*(STAGE_WIDTH-100))+30);
}
UFO.init = function() {
	// start generating new ufo
	UFO.n = setInterval(UFO.g, UFO.cd);
}
UFO.clear = function() {
	// stop the generate loop
	clearInterval(UFO.n);
	// clear current elements
	UFO.list = [];
}

///////////////////////////////////////////////////////////////////////////////////////////////// BULLET

function BULLET(x) {
	// the x should be where warship is
	this.super(x);
	// cache the left & right border of this bullet
	this.left = x - this.half;
	this.right = x + this.half;
	// append
	BULLET.list.push(this);
}
// move
BULLET.prototype.loop = function() {
	this.y -= BULLET.speed;
	stage.drawImage(this.image, this.left, this.y);
	// over border check
	if( this.y < -this.height ) 
		this.destroy();
	// hit check
	for( var i = 0; i < UFO.list.length; i++ ) {
		var ufo = UFO.list[i];
		// this condition may lose 6px, but it's much simpler & faster than precise condition
		if( this.x > ufo.left && this.x < ufo.right && this.y < ufo.y + ufo.height ) {
			ufo.hit();
			// boooom
			new BOOM(this.x, this.y);
		}
	}
}
// destroy
BULLET.prototype.destroy = function() {
	BULLET.list.shift(); // this bullet is always the first one in list
	delete this;
}
// static vars
BULLET.y = WARSHIP.y;
BULLET.image = 'bullet';
BULLET.list  = [];
BULLET.clear = function() {
	BULLET.list = [];
}

////////////////////////////////////////////////////////////////////////////////////////////////// BOOM

function BOOM(x, y) {
	this.super(x, y);
	// save the create time
	this.ct = time();
	BOOM.list.push(this);
}
BOOM.prototype.loop = function() {
	var elapsed = time() - this.ct;
	if( elapsed > BOOM.lasts ) {
		this.destroy();
		return;
	}
	stage.save();
	stage.globalAlpha = 1 - elapsed / BOOM.lasts; // decrase opacity time by time
	stage.drawImage(this.image, this.x - this.half, this.y - this.half);
	stage.restore();
}
BOOM.prototype.destroy = function() {
	BOOM.list.remove(this);
	delete this;
}
BOOM.clear = function() {
	BOOM.list = [];
}
BOOM.image = 'boom';
BOOM.list = [];

////////////////////////////////////////////////////////////////////////////////////////////////// EARTH

function EARTH() {
	this.super();
	this.count = 1;
}
EARTH.prototype.hit = function() {
	var self = this;
	// decrease hp
	hp.decr();
	if( this.count ) clearInterval(this.ticker);
	this.count = 1;
	this.flag = true;
	this.ticker = setInterval(function() {
		if( self.count > 4 ) clearInterval(self.ticker);
		self.flag = self.flag ? false : true;
		self.count++;
	}, 200);
}
EARTH.prototype.loop = function() {
	if( this.flag )
		stage.drawImage(this.image, this.x, this.height/2, this.width, this.height/2, this.x, this.y, this.width, this.height/2);
	else
		stage.drawImage(this.image, this.x, 0, this.width, this.height/2, this.x, this.y, this.width, this.height/2);
}
EARTH.x = 0;
EARTH.y = 420;
EARTH.image = 'earth';
EARTH.tick = null; // timeout to remove the 'hit' class

////////////////////////////////////////////////////////////////////////////////////////////////// HP BAR

function HP() {
	this.super();
	this.margin = this.width + 5;
}
// initialize the hp bar: put 3 healthy heart inside
HP.prototype.init = function() {
	this.hp = HP.total;
}
// when earth is hit...
HP.prototype.decr = function() {
	this.hp--;
	// lose?
	if( this.hp == 0 ) 
		end();
}
HP.prototype.loop = function() {
	for( var i = 0; i < HP.total - 1; i++ ) {
		if( i < this.hp - 1 )
			stage.drawImage(this.image, 0, 0, this.width, this.height/2, this.x + i*this.margin, this.y, this.width, this.height/2);
		else
			stage.drawImage(this.image, 0, this.height/2, this.width, this.height/2, this.x + i*this.margin, this.y, this.width, this.height/2);
	}
}
HP.x = 20;
HP.y = 20;
HP.image = 'life';

////////////////////////////////////////////////////////////////////////////////////////////////// MAIN 

// prepares everything
function init() {
	// get canvas
	canvas = document.getElementById('stage');
	canvas.width = STAGE_WIDTH;
	canvas.height = STAGE_HEIGHT;
	ctx = canvas.getContext('2d');
	// back buffer
	buffer = document.createElement('canvas');
	buffer.width = STAGE_WIDTH;
	buffer.height = STAGE_HEIGHT;
	stage = buffer.getContext('2d');
	// cache elements which always exists only one
	game = document.getElementById('game');
	score = document.getElementById('score');
	earth = new EARTH();
	warship = new WARSHIP();
	hp = new HP();
	// remove the loading mask
	document.getElementById('loading').remove();
	// let the game play
	start();
}

// start a game for user
function start() {
	// set GAME_OVER to false
	GAME_OVER = false;
	GAME_SCORE = 0;
	// init elements
	warship.init();
	UFO.init();
	hp.init();
	// init TIMER
	TIMER();
	// start the main loop
	loop();
	// show the game stage
	game.classList.add('active');
}

// ends the game and clear the stage
function end() {
	// set GAMEOVER to true
	GAME_OVER = true;
	// call clear methods
	UFO.clear();
	BULLET.clear();
	BOOM.clear();
	// fill the score
	score.textContent = GAME_SCORE;
	// show score board
	game.classList.remove('active');
}

// update game every frame 
function loop() {
	// if GAME_OVER then break the loop
	if( GAME_OVER ) return;
	// clear current image on buffer
	ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
	stage.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
	// move forward current elements
	var i, elapsed = TIMER();
	// never cache UFO.list.length here! because ufo.loop will modify the array async
	for( i = 0; i < UFO.list.length; i++ ) UFO.list[i].loop(elapsed);
	for( i = 0; i < BULLET.list.length; i++ ) BULLET.list[i].loop();
	for( i = 0; i < BOOM.list.length; i++ ) BOOM.list[i].loop();
	earth.loop();
	hp.loop();
	warship.loop();
	// swap buffer
	ctx.drawImage(buffer, 0, 0);
	// next loop
	requestAnimationFrame(loop);
}

// make sure all images are loaded before game inits
window.onload = init;