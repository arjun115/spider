import {
  Signal
} from "signals"

export default class SpiderController {
  gameType = null;

  onChange = new Signal();
  onChangePoints = new Signal();
  finishGame = new Signal();

  appliedEvents = [];
  stock = [];
  waste = [];
  foundationCounter = 0;

  foundations = []

  tableau = {
    t1: [],
    t2: [],
    t3: [],
    t4: [],
    t5: [],
    t6: [],
    t7: [],
    t8: [],
    t9: [],
    t10: []
  };

  constructor(type) {
    this.gameType = type;
    window.controller = this
  }

  prepare(deck) {
    for (let card of deck) {
      this.stock.push({
        id: card.id,
        number: card.number,
        color: card.color,
        flipped: card.flipped
      });
    }
    this._shuffleDeck();

    let events = [];
    let flipEvents = [];

    for (let i = 0; i < 10; i++) {
      let cardNum = 6
      if (i > 3) cardNum = 5
      for (let j = 0; j < cardNum; j++) {
        let card = this.stock.pop();
        this.tableau[`t${i + 1}`].push(card);
        if (j == cardNum - 1) {
          flipEvents.push({
            card,
            flip: {
              flipped: false,
              prev: card.flipped
            }
          });

          card.flipped = false;
        }
        events.push({
          card,
          move: {
            field: "tableau",
            number: i + 1,
            order: j,
            from: {}
          }
        });
      }
    }

    this._applyEvents(events, true);
    setTimeout(() => {
      this._applyEvents(flipEvents, true);
    }, 300);
  }

  undo() {
    if (!this.appliedEvents.length) return;

    this.onChangePoints.dispatch(-5)
    let undoEvents = this.appliedEvents.pop();
    let moveEvents = [];
    let flipEvents = [];
    let events = [];

    let moveTypes = []
    for (let event of undoEvents.reverse()) {
      if (event.move) {
        moveTypes.push(`${event.move.field}-${event.move.number}`)
        moveEvents.push(event);
      } else if (event.flip) {
        flipEvents.push(event);
      }
    }

    if (moveEvents.length > 1 && moveEvents.length < 14) {
      let uniqueTypes = new Set(moveTypes)
      if (uniqueTypes.size > 1) {
        let groupedMoves = {}
        for (let event of moveEvents) {
          if (!groupedMoves[`${event.move.field}-${event.move.number}`]) {
            groupedMoves[`${event.move.field}-${event.move.number}`] = []
          }
          groupedMoves[`${event.move.field}-${event.move.number}`].push(event)
        }
        if (groupedMoves['stock-1']) {
          groupedMoves['stock-1'] = groupedMoves['stock-1'].reverse()
        }
        for (let group in groupedMoves) {
          groupedMoves[group].forEach(event => events.push(this._undoExactMove(event)))
        }
      } else {
        if (uniqueTypes.keys().next().value === 'foundations-1') {
          this.foundationCounter--;
          moveEvents.forEach(event => events.push(this._undoExactMove(event)))
        } else {
          events.push(...this._undoMultiMove(moveEvents));
        }
      }
    } else {
      for (let event of moveEvents) {
        events.push(this._undoMove(event));
      }
    }

    for (let event of flipEvents) {
      events.push(this._undoFlip(event));
    }

    this.onChange.dispatch(events);
  }

  _undoMove(event) {
    let {
      card,
      move: {
        from
      }
    } = event;
    let currentList = this._getField(event.move.field, event.move.number);
    let undoList = this._getField(
      event.move.from.field,
      event.move.from.number
    );
    let undoCard = currentList.pop();
    undoList.push(undoCard);
    return {
      card,
      move: from
    };
  }

  _undoMultiMove(events) {
    let undoEvents = [];
    for (let event of events) {
      let {
        card,
        move: {
          from
        }
      } = event;
      undoEvents.push({
        card,
        move: from
      });
    }

    // fix controller status
    let event = events[0];
    let currentList = this._getField(event.move.field, event.move.number);
    let undoList = this._getField(
      event.move.from.field,
      event.move.from.number
    );
    let tempCardList = currentList.splice(
      currentList.length - events.length,
      events.length
    );
    undoList.push(...tempCardList);

    return undoEvents;
  }

  _undoExactMove(event) {
    let {
      card,
      move: {
        from
      }
    } = event;
    let currentList = this._getField(event.move.field, event.move.number);
    let undoList = this._getField(
      event.move.from.field,
      event.move.from.number
    );

    let moveIndex = null
    for (let [index, c] of currentList.entries()) {
      if (card.id === c.id) {
        moveIndex = index
      }
    }
    let tempCard = currentList.splice(moveIndex, 1)
    undoList.push(...tempCard)

    return {
      card,
      move: from
    }
  }

  _undoFlip(event) {
    let {
      card,
      flip: {
        prev
      }
    } = event;
    card.flipped = prev;
    return {
      card,
      flip: {
        flipped: prev
      }
    };
  }

  _getField(fieldName, fieldNumber) {
    let field = this[fieldName];
    if (fieldName === "tableau") {
      field = field[fieldName.charAt(0) + fieldNumber];
    }
    return field;
  }

  canDrag(id) {
    for (let card of this.stock) {
      if (card.id === id) return false;
    }

    let tempNumber = null
    let tempColor = null

    for (let key in this.tableau) {
      let tableauList = this.tableau[key];
      for (let [index, card] of tableauList.entries()) {
        if (card.id === id) {
          tempNumber = card.number
          tempColor = card.color

          if (card.flipped) {
            return false;
          }
          if (tableauList[index + 1]) {
            for (let i = index + 1; i < tableauList.length; i++) {
              let fieldCard = tableauList[i]

              if (fieldCard.color == tempColor && fieldCard.number + 1 == tempNumber) {
                tempColor = fieldCard.color
                tempNumber = fieldCard.number
              } else {
                return false
              }
            }
          }
        }
      }
    }
    return true;
  }

  canPlace(id, field, number) {
    let holderKey = field.charAt(0) + number;
    let cardList = this[field][holderKey];
    if (field === "tableau")
      return this._canPlaceTableau(this._getCardInfo(id), cardList, number);

    return false;
  }

  canOpen(cardId) {
    let info = this._getCardInfo(cardId);
    if (info["fieldName"] !== "stock") return false;
    if (this._chekCanOpen()) {
      let events = [];
      for (let i = 0; i < 10; i++) {
        let card = this.stock.pop();
        this.tableau[`t${i+1}`].push(card)
        events.push({
          card,
          move: {
            field: "tableau",
            number: i + 1,
            order: this.tableau[`t${i+1}`].length - 1,
            from: {
              field: "stock",
              number: info.fieldNumber,
              order: info.cardOrder
            }
          }
        });
        events.push({
          card,
          flip: {
            flipped: false,
            prev: card.flipped
          }
        });
        card.flipped = false;
      }
      this._applyEvents(events);
      return true;
    }
    return false
  }

  _chekCanOpen() {
    for (let key in this.tableau) {
      if (!this.tableau[key].length) return false;
    }
    return true;
  }


  getTableauArray(id) {
    let list = [];
    for (let key in this.tableau) {
      let collectable = false;
      for (let [index, card] of this.tableau[key].entries()) {
        if (id === card.id) {
          collectable = true;
        }
        if (collectable) {
          list.push(card);
        }
      }
    }
    return list;
  }

  _canPlaceTableau(cardInfo, cardList, fieldNumber) {
    let {
      card,
      field,
      fieldKey,
      fieldName
    } = cardInfo;
    if (fieldName === "tableau") {
      let lastCard = cardList[cardList.length - 1] || null;
      if (lastCard) {
        let condition =
          card.number + 1 === lastCard.number
        if (!condition) return false;
      }
      let collectable = false;
      let movingList = [];
      let removeIds = [];
      for (let [index, fieldCard] of field.entries()) {
        if (card.id === fieldCard.id) {
          collectable = true;
        }
        if (collectable) {
          movingList.push(fieldCard);
          removeIds.push(index);
        }
      }
      field.splice(removeIds[0], removeIds.length);
      let events = [];
      movingList.forEach((movingCard, index) => {
        cardList.push(movingCard);
        events.push({
          card: movingCard,
          move: {
            field: "tableau",
            number: fieldNumber,
            order: cardList.length - 1,
            from: {
              field: fieldName,
              number: cardInfo.fieldNumber,
              order: removeIds[index]
            }
          }
        });
      });
      let lastFieldCard = field[field.length - 1] || null;
      if (lastFieldCard) {
        if (lastFieldCard.flipped) {
          events.push({
            card: lastFieldCard,
            flip: {
              flipped: false,
              prev: lastFieldCard.flipped
            }
          });
          this.onChangePoints.dispatch(5)
          lastFieldCard.flipped = false;
        }
      }
      this._applyEvents(events);
      return true;
    }

    return false;
  }

  _getCardInfo(id) {
    for (let [index, card] of this.stock.entries()) {
      if (card.id === id)
        return {
          card,
          field: this.stock,
          fieldName: "stock",
          fieldKey: null,
          fieldNumber: 1,
          cardOrder: index
        };
    }
    for (let [index, card] of this.foundations.entries()) {
      if (card.id === id)
        return {
          card,
          field: this.foundations,
          fieldName: "foundations",
          fieldKey: null,
          fieldNumber: 1,
          cardOrder: index
        };
    }
    for (let key in this.tableau) {
      for (let [index, card] of this.tableau[key].entries()) {
        if (card.id === id)
          return {
            card,
            field: this.tableau[key],
            fieldName: "tableau",
            fieldKey: key,
            fieldNumber: parseInt(key.split("").splice(1, 2).join(""), 10),
            cardOrder: index
          };
      }
    }
    return null;
  }

  _shuffleDeck() {
    for (let i = 0; i < this.stock.length; i++) {
      let randomCard = Math.round(Math.random() * (this.stock.length - 1));
      let temp = this.stock[i];
      this.stock[i] = this.stock[randomCard];
      this.stock[randomCard] = temp;
    }
  }

  _applyEvents(eventList, ignore) {
    if (!ignore) {
      this.appliedEvents.push(eventList);
    }
    this.onChange.dispatch(eventList);
  }

  _checkArragedCards(holder, cardInfo) {
    if (this.tableau[holder].length - cardInfo.cardOrder == 13) {
      let counter = 0;
      for (let i = 0; i < 13; i++) {
        let card = this.tableau[holder][cardInfo.cardOrder + i]
        if (this.tableau[holder][cardInfo.cardOrder + (i + 1)]) {
          if (card.number == this.tableau[holder][cardInfo.cardOrder + (i + 1)].number + 1 && card.color == this.tableau[holder][cardInfo.cardOrder + (i + 1)].color) {
            counter++;
          }
        }
      }

      if (counter == 12) {
        return true
      } else {
        return false;
      }
    }
  }

  _moveToFoundations(holder, fieldNumber) {
    let events = [];
    for (let i = 0; i < 13; i++) {
      let order = this.tableau[holder].length - 1
      let card = this.tableau[holder].pop();
      this.foundations.push(card)
      events.push({
        card,
        move: {
          field: "foundations",
          number: 1,
          order: 0,
          from: {
            field: "tableau",
            number: fieldNumber,
            order
          }
        }
      });
      if (i == 12) {
        let card = this.tableau[holder][this.tableau[holder].length - 1]
        if (card) {
          events.push({
            card,
            flip: {
              flipped: false,
              prev: card.flipped
            }
          });
          card.flipped = false;
        }
      }
    }

    this._applyEvents(events);
    this.foundationCounter++
  }

  checkForFoundation() {
    for (let holder in this.tableau) {
      if (this.tableau[holder].length >= 13) {
        for (let cards of this.tableau[holder]) {
          if (cards.number === 13 && !cards.flipped) {
            let info = this._getCardInfo(cards.id);
            if (this._checkArragedCards(holder, info)) {
              this._moveToFoundations(holder, info.fieldNumber)
            }
          }
        }
      }
    }
  }

  checkFinish() {
    let finished = 0
    if (!this.stock.length) {
      for (let holder in this.tableau) {
        if (!this.tableau[holder].length) finished++
      }
      if (finished == 10) this.finishGame.dispatch()
    }
  }
}