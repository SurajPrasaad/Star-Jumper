var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let platforms, player, stars, bombs, cursors;
let score = 0, scoreText;
let gameOver = false;
let gameOverText, finalScoreText, restartButton, highestScoreText;
let starSound, bombSound;

let game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/image.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });

    // Load sounds
    this.load.audio('starSound', 'assets/soundStar.wav'); // star collection
    this.load.audio('bombSound', 'assets/bombSound.wav'); // bomb hit
}

function create() {
    this.add.image(400, 300, 'sky').setDisplaySize(800, 600);

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'turn', frames: [{ key: 'dude', frame: 4 }], frameRate: 20 });
    this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });

    this.physics.add.collider(player, platforms);

    stars = this.physics.add.group({ key: 'star', repeat: 11, setXY: { x: 12, y: 0, stepX: 70 } });
    stars.children.iterate(child => child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)));
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    cursors = this.input.keyboard.createCursorKeys();

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    gameOverText = this.add.text(400, 250, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
    gameOverText.visible = false;

    restartButton = this.add.text(400, 350, 'Restart Game', { fontSize: '32px', fill: '#00f' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => restartGame(this));
    restartButton.visible = false;

    finalScoreText = this.add.text(400, 400, '', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    finalScoreText.visible = false;

    highestScoreText = this.add.text(16, 50, '', { fontSize: '24px', fill: '#ffff00' });
    let highestScore = localStorage.getItem('highestScore') || 0;
    highestScoreText.setText('Highest Score: ' + highestScore);

    // Add sounds
    starSound = this.sound.add('starSound');
    bombSound = this.sound.add('bombSound');
}

function update() {
    if (gameOver) return;

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
    starSound.play();

    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => child.enableBody(true, child.x, 0, true, true));
        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        let bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');

    // ✅ Play bomb sound
    bombSound.play();

    gameOver = true;
    gameOverText.visible = true;
    restartButton.visible = true;
    finalScoreText.setText('Final Score: ' + score);
    finalScoreText.visible = true;

    let highestScore = localStorage.getItem('highestScore') || 0;
    if (score > highestScore) {
        localStorage.setItem('highestScore', score);
        highestScore = score;
    }
    highestScoreText.setText('Highest Score: ' + highestScore);
    highestScoreText.visible = true;
}

function restartGame(scene) {
    gameOver = false;
    score = 0;
    scoreText.setText('Score: ' + score);
    gameOverText.visible = false;
    restartButton.visible = false;
    finalScoreText.visible = false;
    highestScoreText.visible = true;

    bombs.clear(true, true);

    player.clearTint();
    player.setPosition(100, 450);
    player.setVelocity(0, 0);

    stars.children.iterate(child => child.enableBody(true, child.x, 0, true, true));

    scene.physics.resume();
}
