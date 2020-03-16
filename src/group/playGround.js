import Card from "../component/Card";

class PlayGround extends Phaser.GameObjects.Group {
  controller;

  foundations = [];
  tableau = [];
  stock = null;
  holderMap = {};
  multipleCards = [];
  lastTimeClick = 0
  moveMultipleCards = false

  deck = [];
  deckMap = {};

  constructor(scene, controller) {
    super();
    window.deck = this.deckMap;
    this.controller = controller;

    this.stock = scene.add.sprite(90, 270, "holder");
    this.stock.setOrigin(0.5);
    this.stock.type = "stock";
    this.stock.no = 1;
    this.stock.alpha = .5
    this.stock.setInteractive();

    this.holderMap["stock1"] = this.stock;

    this.foundations = scene.add.sprite(600, 270, "holder");
    this.foundations.setOrigin(0.5);
    this.foundations.type = "foundations";
    this.foundations.no = 1;
    this.foundations.alpha = 0
    this.holderMap["foundations1"] = this.foundations;

    for (let i = 0; i < 8; i++) {
      let holder = scene.add.sprite((600 + i * 165), 270, "holder");
      holder.setOrigin(0.5);
      holder.type = `foundations`;
      holder.no = i + 1;
      holder.alpha = .5
    }

    for (let i = 0; i < 10; i++) {
      let holder = scene.add.sprite((400 + i * 185) - 310, 280 + 240, "holder");
      holder.setOrigin(0.5);
      holder.type = `tableau`;
      holder.no = i + 1;
      holder.alpha = .5
      this.holderMap[`tableau${i + 1}`] = holder;
      this.tableau.push(holder);
      this.add(holder);
    }

    for (let i = 0; i < 104; i++) {
      let number = (i % 13) + 1;
      let colorNo = 2;

      if (this.controller.gameType == 2) {
        if (i > 52) {
          colorNo = 1
        }
      } else if (this.controller.gameType == 4) {
        if (i < 27) {
          colorNo = 0
        } else if (i > 26 && i <= 52) {
          colorNo = 1
        } else if (i > 52 && i <= 78) {
          colorNo = 2
        } else if (i > 78 && i <= 104) {
          colorNo = 3
        }
      }
      let card = new Card(
        scene,
        this.stock.x - i / 4,
        this.stock.y - i / 3,
        number,
        colorNo,
        i
      );
      this.deck.push(card);
      this.deckMap[card.id] = card;
      card.onDrag.add(this._cardDrag, this);
      card.onClick.add(this._cardClick, this);
    }

    this.controller.onChange.add(this._onChange, this);
    this.controller.prepare(this.deck);
    // this.controller.fakePrepare(this.deck);

    scene.input.on("dragstart", (pointer, card) => {
      let canBeDragged = this.controller.canDrag(card.id);
      if (canBeDragged) {
        this.multipleCards = this.controller.getTableauArray(card.id);

        card.dragStart();
        if (this.multipleCards.length > 1) this._moveMultipleCards();
      }
      // call the controller to tell the draggable elements
    });
    scene.input.on("drag", (pointer, card, x, y) => {
      card.drag(x, y);
      if (this.multipleCards.length > 1) this._moveMultipleCards();
      // drag single card or drag multiple cards
    });
    scene.input.on("dragend", (pointer, card) => {
      card.dragEnd(); // ignore childs to be checked about place
      // call drag end on all cards
      // this.controller.chekArrangedCards()
      this.controller.checkForFoundation()
      this.moveMultipleCards = false
    });
  }

  _moveMultipleCards() {
    this.moveMultipleCards = true;
    let firstCard = this.multipleCards[0];
    let offSet = 0;

    for (let card of this.multipleCards) {
      if (offSet >= 1) {
        this.deckMap[card.id].x = this.deckMap[firstCard.id].x;
        this.deckMap[card.id].y = this.deckMap[firstCard.id].y + offSet * 40;
      }
      offSet++;
    }

    this._sortDragingCards();
  }

  _sortDragingCards() {
    this.multipleCards.forEach((data, index) => {
      let card = this.deckMap[data.id];
      card.setOrder(index * 1500);
    });
  }

  _moveBackMultipleCards() {
    let firstCard = this.multipleCards[0];
    let offSet = 0;
    for (let card of this.multipleCards) {
      if (offSet >= 1) {
        this.deckMap[card.id].goTo(
          this.deckMap[firstCard.id].previous.x,
          this.deckMap[firstCard.id].previous.y + offSet * 40
        );
      }
      offSet++;
    }
  }

  _cardDrag(card) {
    let data = this._canPlace(card);
    // ignore asking the controller for placing child cards
    if (data) {
      let placed = this.controller.canPlace(card.id, data.type, data.number);
      if (placed) return;
    }
    card.goTo(card.previous.x, card.previous.y);
    if (this.multipleCards.length > 1) {
      this._moveBackMultipleCards();
    }
    // if card contains child cards
  }

  _cardClick(card) {
    let clickDelay = card.scene.time.now - this.lastTimeClick;
    this.lastTimeClick = card.scene.time.now
    if (clickDelay < 350) {
      // this.controller.checkPossibleMove(card.id, true)
    } else {
      this.controller.canOpen(card.id)
      // this.controller.checkPossibleMove()
      // this.controller.chekArrangedCards()
      // this.controller.checkForFoundation()
    }
  }

  _canPlace(card) {
    let fields = [...this.tableau, this.stock];
    let holders = fields.filter(field => {
      let rect = field.getBounds();
      if (field.type == "tableau") {
        rect.height = 1000;
      }
      return rect.contains(card.x, card.y);
    });
    if (holders.length) {
      let holder = holders[0];
      return {
        type: holder.type,
        number: holder.no
      };
    } else {
      return null;
    }
  }

  _onChange(events) {
    // execute the events
    for (let event of events) {
      if (event.flip) {
        if (event.card) {
          this._flipCard(event.card, event.flip);
        } else if (event.cards) {
          this._flipCard(event.cards, event.flip);
        }
      }
      if (event.move) {
        if (event.card) {
          this._moveCard(event.card, event.move);
        } else if (event.cards) {
          this._moveCard(event.cards, event.move)
        }
      }
    }
    this.controller.checkFinish();
  }

  _flipCard(card, {
    flipped
  }) {
    this.deckMap[card.id].flip(flipped);
  }

  _moveCard(card, {
    field,
    number,
    order
  }) {
    this._cardPlacing(this.deckMap[card.id], field, number, order);
  }

  _sort() {
    // sort after ending the tween
    if (this.moveMultipleCards) return
    let counter = 0;
    let offSetX = 0;
    let offSetY = 0;
    for (let i = 0; i < this.controller.stock.length; i++) {
      let data = this.controller.stock[i];
      let card = this.deckMap[data.id];
      card.setOrder(i);
      card.x = (this.stock.x + offSetX) + i / 2;
      card.y = this.stock.y - offSetY;
      if (counter == 10) {
        counter = 0;
        offSetX += 20;
        offSetY = 0;
      }
      offSetY++
      counter++;
    }

    this.controller.foundations.forEach((data, index) => {
      let card = this.deckMap[data.id];
      card.setOrder(index);
    });

    for (let id in this.controller.tableau) {
      let tableau = this.controller.tableau[id];

      tableau.forEach((data, index) => {
        let card = this.deckMap[data.id];
        card.setOrder(index);
      });
    }
  }

  _cardPlacing(card, field, number, order) {
    let holder = this.holderMap[field + number];

    if (holder.type === "stock") {
      card.goTo(holder.x - order / 2, holder.y - order);
    } else if (holder.type === "tableau") {
      card.goTo(holder.x, holder.y + order * 40);
    } else if (holder.type === "foundations") {
      card.goTo(holder.x + (this.controller.foundationCounter * 165), holder.y);
    }
  }
}

export default PlayGround;