import SpiderController from "../controller/spiderController";
import PlayGround from "../group/playGround";
import Button from "../component/Button";

export default class GameScene extends Phaser.Scene {
  controller = null;
  playGround = null;
  btn_new = null;
  btn_options = null;
  btn_how_to = null;
  btn_undo = null;

  new_text = null;
  options_text = null;
  how_to_text = null;
  undo_text = null;

  optionsPopUpGroup = null;
  howToPopUpGroup = null;
  finishPopUpGroup = null
  timer = null;
  counter = 0;
  points = 0;
  popUpIsOpen = false;

  score_img = null
  time_img = null

  // popUp = null;
  // tranpsBg = null;

  // btn_exit = null;
  // btnOneSuit = null;
  // btnTwoSuits = null;

  // oneSuitText = null;
  // twoSuitsText = null;

  constructor() {
    super({
      key: "game"
    });
  }

  create() {
    let {
      type
    } = this.scene.settings.data;

    this.cameras.main.setBackgroundColor('#ffffff')
    this.btn_new = new Button(this, 372 - 310, 78, "button_three_card");
    this.btn_new.setOrigin(0.5);
    this.btn_new.onClick.add(this.btnNewClicked, this);

    this.suit_1 = new Button(this, 492 - 310, 78, "1_suit");
    this.suit_1.setOrigin(0.5);
    this.suit_1.onClick.add(() => this.game.customOptions.openGame(1), this);

    this.suit_2 = new Button(this, 612 - 310, 78, "2_suit");
    this.suit_2.setOrigin(0.5);
    this.suit_2.onClick.add(() => this.game.customOptions.openGame(2), this);

    this.suit_4 = new Button(this, 732 - 310, 78, "4_suit");
    this.suit_4.setOrigin(0.5);
    this.suit_4.onClick.add(() => this.game.customOptions.openGame(4), this);

    this.btn_how_to = new Button(this, 1683, 78, "button_how_to");
    this.btn_how_to.setOrigin(0.5);
    this.btn_how_to.onClick.add(() => {
      this.game.customOptions.onHowTo()
    }, this)

    this.btn_undo = new Button(this, 1803, 78, "button_undo");
    this.btn_undo.onClick.add(() => this.controller.undo());
    this.btn_undo.setOrigin(0.5);

    this.score_img = this.add.image(982.5, 69, 'score')
    this.score_img.setOrigin(.5)

    this.time_img = this.add.image(1162, 69, 'time')
    this.time_img.setOrigin(.5)

    this.points_text = this.add.text(1034.5, 69, "0", {
      fontFamily: "Titillium Web",
      fontStyle: 'bold',
      fontSize: "28px",
      color: "#000000",
      align: 'left'
    });
    this.points_text.setOrigin(0, 0.5);
    this.time_text = this.add.text(1207, 69, "00:00", {
      fontFamily: "Titillium Web",
      fontStyle: 'bold',
      fontSize: "28px",
      color: "#000000",
      align: 'left'
    });
    this.time_text.setOrigin(0, 0.5);

    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => this.count(),
      loop: true
    });

    this.onPlayClick(type);

    this.controller.onChangePoints.add(this.changePointsText, this)
    this.controller.finishGame.add(() => {
      this.popUpIsOpen = true;
     
      for (let cardId in this.playGround.deckMap) {
        
        // let card = this.playGround.deckMap[cardId]
        // card
        this.playGround.deckMap[cardId].on("pointerdown", () => {
          this.popUpIsOpen = false;
          this.points = 0
          this.counter = 0
          this.scene.restart({
            type: this.scene.settings.data.type
          });
        });
        this.physics.world.enable(this.playGround.deckMap[cardId])
        this.playGround.deckMap[cardId].body.setVelocity(0 + Math.random() * 100, 200 + Math.random() * 400).setBounce(1, 1).setCollideWorldBounds(true);
      }
      // this.finishGamePopUp()
    }, this)

  }

  count() {
    if (!this.popUpIsOpen) this.counter++;

    this.time_text.setText(`${this.timeParser(this.counter)}`);
  }

  timeParser(seconds = 1) {
    let min = window.Math.floor(seconds / 60);
    min = min < 10 ? "0" + min : min;
    let sec = seconds % 60;
    sec = sec < 10 ? "0" + sec : sec;
    return `${min}:${sec}`;
  }

  onPlayClick(type) {
    this.controller = new SpiderController(type || 1);
    this.playGround = new PlayGround(this, this.controller);
  }

  btnNewClicked() {
    this.points = 0
    this.counter = 0
    this.scene.restart({
      type: this.scene.settings.data.type
    });
  }

  btnHowToClicked() {
    this.popUpIsOpen = true
    this.howToPopUpGroup = this.add.group();
    let tranpsBg = new Button(this, 960 - 310, 540, "tranps_bg");
    tranpsBg.setInteractive();

    let popUp = this.howToPopUpGroup.create(960 - 310, 540, "pop_up");
    popUp.setOrigin(0.5);
    popUp.setInteractive();

    let howToText = this.add.text(
      960,
      540,
      "The card piles in board can be build down by decrescent card number with alternate color.\n" +
      "GOAL : The goal is to build up four foundation by suit, from Ace to King.", {
        fontFamily: "Titillium Web",
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: {
          width: popUp.width - 20,
          useAdvancedWrap: false
        }
      }
    );
    howToText.setStroke("#ffffff", 1);
    howToText.setOrigin(0.5);

    let buttonNext = new Button(this, 1180 - 310, 590, "arrow");
    buttonNext.setOrigin(0.5);
    buttonNext.setInteractive();

    let buttonPrev = new Button(this, 730 - 310, 590, "arrow");
    buttonPrev.flipX = true;
    buttonPrev.setOrigin(0.5);
    buttonPrev.setInteractive();
    buttonPrev.alpha = 0;

    this.howToPopUpGroup.add(howToText);
    this.howToPopUpGroup.add(buttonNext);
    this.howToPopUpGroup.add(buttonPrev);
    this.howToPopUpGroup.add(tranpsBg);

    this.howToPopUpGroup.setDepth(5000);

    buttonNext.onClick.add(() => {
      buttonNext.alpha = 0;
      buttonPrev.alpha = 1;
      howToText.setText(
        "POINTS :\nWaste to Tableau = 5\nWaste to Foundation = 10\nTableau to Foundation = 10\nTurn over Tableau card = 5\nFoundation to Tableau = -15"
      );
    }, this);

    buttonPrev.onClick.add(() => {
      buttonPrev.alpha = 0;
      buttonNext.alpha = 1;
      howToText.setText(
        "The card piles in board can be build down by decrescent card number with alternate color.\n" +
        "GOAL : The goal is to build up four foundation by suit, from Ace to King."
      );
    }, this);

    tranpsBg.onClick.add(() => {
      this.popUpIsOpen = false
      this.howToPopUpGroup.clear(this);
    }, this);
  }

  changePointsText(change) {
    this.points = this.points + change < 0 ? 0 : this.points + change
    this.points_text.setText(`${this.points}`)
  }

  finishGamePopUp() {
    this.popUpIsOpen = true
    this.finishPopUpGroup = this.add.group();
    let tranpsBg = new Button(this, 960 - 310, 540, "tranps_bg");
    tranpsBg.setInteractive();
    tranpsBg.setDepth(10000)

    let popUp = this.finishPopUpGroup.create(960 - 310, 540, "pop_up");
    popUp.setOrigin(0.5);
    popUp.setInteractive();

    let winText = this.add.text(
      960 - 310,
      540,
      `CONGRATULATIONS\n You complete the game !!\nSCORE: ${this.points}`, {
        fontFamily: "Titillium Web",
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: {
          width: popUp.width - 20,
          useAdvancedWrap: false
        }
      }
    );
    winText.setStroke("#ffffff", 1);
    winText.setOrigin(0.5);

    this.finishPopUpGroup.add(winText)

    tranpsBg.onClick.add(() => {
      this.popUpIsOpen = false
      this.finishPopUpGroup.clear(this);
      this.points = 0
      this.counter = 0
      this.scene.restart({
        type: this.scene.settings.data.type
      });
    }, this);
    this.finishPopUpGroup.children.entries.forEach(entry => {
      entry.setDepth(10001)
    })
  }

  update() {
    this.playGround._sort()
  }
}