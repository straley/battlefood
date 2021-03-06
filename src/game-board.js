import { PolymerElement, html } from "@polymer/polymer/polymer-element.js";
import "@polymer/iron-icons/iron-icons.js";
import "./game-icons.js";
import "./game-tile.js";

import { foodTiles, foods, recipes } from "./game-foods.js";

class GameBoard extends PolymerElement {
  static get properties() {
    return {
      boardSize: Number,
      tileSize: Number,
      boardWidth: Number,
      boardHeight: Number,
      placements: Object,
      placed: Object,
      foods: Object,
      found: Number,
      recipe: Object,
      coins: Number,
      modalIcon: String,
      modalMessage: String,
      modalButton: String,
      modalVisible: Boolean,
      modalClick: Function
    };
  }

  static get template() {
    return html`
      <style>
        #game {
          display: block;
          width: 100%;
          position: relative;
        }

        .food {
          display: block;
          position: absolute;
          --iron-icon-height: calc(var(--game-tile-size) * 8);
          --iron-icon-width: calc(var(--game-tile-size) * 8);
        }

        #sidebar {
          display: inline-block;
          position: relative;
          width: 140px;
          vertical-align: top;
        }

        .panel {
          width: 100%;
          text-align: center;
          background-color: #f8f8f8;
          border-radius: 5px;
          padding: 0 0 10px 0;
          margin: 0 0 5px 0;
        }

        .header {
          display: inline-block;
          width: 100%;
          height: 40px;
          margin: 5px 0 5px 0;
        }

        .header h2 {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          line-height: 16px;
          margin: 0;
          padding: 0;
        }

        .header h3 {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 14px;
          margin: 0;
          padding: 0;
        }

        .ingredient {
          margin-left: 40px;
          display: block;
          position: relative;
          --iron-icon-height: 60px;
          --iron-icon-width: 60px;
        }

        .coins {
          margin-left: 50px;
          display: block;
          position: relative;
          --iron-icon-height: 40px;
          --iron-icon-width: 40px;
        }

        .board {
          display: inline-block;
          position: relative;
        }

        #modal {
          position: fixed;
          z-index: 1;
          left: 0;
          top: 0;
          width: 100%; 
          height: 100%;
          overflow: auto;
          background-color: rgb(0,0,0); 
          background-color: rgba(0,0,0,0.4); 
        }

        #modal .content {
          border-radius: 5px;
          background-color: #fefefe;
          margin: 15% auto;
          padding: 20px;
          border: 1px solid #888;
          width: 300px; 
          text-align: center;
        }

        #modal .content iron-icon {
          display: inline-block;
          position: relative;
          --iron-icon-height: 50px;
          --iron-icon-width: 50px;
          vertical-align: middle;
        }

        #modal .content div {
          font-family: Arial, Helvetica, sans-serif;
          display: inline-block;
          position: relative;
          width: 220px;
          vertical-align: middle;
          margin: 0 0 0 20px;
          text-align: left;
          font-size: 18px;
        }

        #modal .content button {
          font-family: Arial, Helvetica, sans-serif;
          border-radius: 5px;
          background-color: #f4df89;
          border: 0;
          shadow: 0;
          font-size: 16px;
          margin: 10px 0 5px 0;
          padding: 10px;
          outline: 0;
          cursor: pointer;
        }

        #modal .content button:hover {
          background-color: #f8efb0;
        }


      </style>

      <game-icons></game-icons>
      <div id="game">
        <div class="board" style="width:[[boardWidth]]px; height:[[boardHeight]]px;">

          <template is="dom-repeat" items="[[placements]]" as="placement">
            <iron-icon
              icon="food:[[placement.food]]"
              role="img"
              class="food"
              style="top: [[placement.top]]px; left: [[placement.left]]px;"
            ></iron-icon>
          </template>

          <template is="dom-repeat" items="[[board]]" as="tile">
            <game-tile 
              x="[[tile.x]]" 
              y="[[tile.y]]" 
              food="[[tile.food]]" 
              state="[[tile.state]]"
              icon="[[tile.icon]]"
            />
          </template>

        </div>
        <div id="sidebar">
          <div class="panel">
            <div class="header">
              <iron-icon
                  icon="game:coins"
                  role="img"
                  class="coins"
                ></iron-icon>            
              
              <h3>[[coins]]</h3>
            </div>
          </div>
          <div class="panel">
            <div class="header">
              <h2>Ingredients</h2>
              <h3>[[recipe.name]]</h3>
            </div>
            <template is="dom-repeat" items="[[recipe.ingredients]]" as="ingredient">
              <iron-icon
                icon="food:[[ingredient]]"
                role="img"
                class="ingredient"
              ></iron-icon>            
            </template>
          </div>
        </div>
      </div>
      <div id="modal" hidden$="[[!modalVisible]]">
        <div class="content">
          <iron-icon
            icon="[[modalIcon]]"
            role="img"
            class="modal-icon"
          ></iron-icon>            
          <div>[[modalMessage]]</div>
          <button id="modal-button" type="button" on-click="handleModalClick">[[modalButton]]</button>
        </div>
      </div>
    `;
  }

  constructor() {
    super();

    // set game attributes

    // set the size of things
    this.boardSize = 20;
    this.tileSize = 32;
    this.boardWidth = this.boardSize * this.tileSize;
    this.boardHeight = this.boardSize * this.tileSize;
    this.numberOfFoodsToPlace = 8;

    // update the cssvar "--game-tile-size"
    this.updateStyles({ "--game-tile-size": `${this.tileSize}px` });
    this.updateStyles({ "--game-board-size": this.boardSize });

    // play game
    this.resetGame();
  }

  resetGame() {
    this.found = 0;
    this.coins = 20;
    this.gameState = "initializing";

    this.placed = [];
    this.foodsPlaced = [];
    this.recipe = "";
    this.spoilers = [];

    this.pickRecipe();
    this.randomizeBoard();

    this.showModal(
      "game:coins",
      `Here's ${this.coins} Coins To Start Your ${this.recipe.name}`,
      "I'm Ready!",
      () => {
        this.gameState = "playing";
      }
    );
  }

  pickRecipe() {
    // store where large food svgs are placed
    this.placements = [];

    // store the foods on the board
    this.foodsPlaced = {};

    // get the game recipe
    this.recipe = recipes[Math.floor(Math.random() * recipes.length)];

    // add some ingredients that are not needed (up to numberOfFoodsToPlace)
    this.spoilers = Object.keys(foods)
      .filter(food => !this.recipe.ingredients.includes(food))
      .sort((a, b) => (Math.random() > 0.5 ? -1 : 1))
      .splice(0, this.numberOfFoodsToPlace - this.recipe.ingredients.length);

    // and put all this in a placed array
    this.placed = [...this.recipe.ingredients, ...this.spoilers];

    this.placed.forEach(food => {
      const tileCount = foodTiles[food].reduce(
        (total, row) => total + row.reduce((total, value) => total + value, 0),
        0
      );
      this.foodsPlaced[food] = {
        ...foods[food],
        tileCount,
        tiles: []
      };
    });
  }

  randomizeBoard() {
    // how many foods have been fitted to the board
    let foodFitted = 0;

    // the test board
    let candidate;

    // build board
    while (foodFitted < this.placed.length) {
      // make a blank "candidate" board
      candidate = [...Array(this.boardSize).keys()].map(y =>
        [...Array(this.boardSize).keys()].map(x => "")
      );

      // loop through the foods needed
      this.placed.forEach(key => {
        const tiles = foodTiles[key];

        // start scanning at x, y
        const x = Math.floor(Math.random() * (this.boardSize - 8));
        const y = Math.floor(Math.random() * (this.boardSize - 8));

        // go through all the possibilities
        place: {
          for (let dx = 0; dx < this.boardSize - 8; dx++) {
            for (let dy = 0; dy < this.boardSize - 8; dy++) {
              // see if we've gone past the end of the board or not
              const px = x + dx >= this.boardSize - 8 ? x + dx - (this.boardSize - 8) : x + dx;
              const py = y + dy >= this.boardSize - 8 ? y + dy - (this.boardSize - 8) : y + dy;
              // assume things are a fit until otherwise
              let fit = true;

              // check for fit
              test: {
                for (let tx = 0; tx < 8; tx++) {
                  for (let ty = 0; ty < 8; ty++) {
                    if (tiles[ty][tx] && candidate[py + ty][px + tx] !== "") {
                      fit = false;
                      // not fix, break out of loop
                      break test;
                    }
                  }
                }
              }

              // if the piece foodFitted, then map the tiles
              if (fit) {
                foodFitted++;
                this.placements.push({
                  food: key,
                  left: px * this.tileSize,
                  top: py * this.tileSize
                });
                for (let tx = 0; tx < 8; tx++) {
                  for (let ty = 0; ty < 8; ty++) {
                    if (tiles[ty][tx]) {
                      candidate[py + ty][px + tx] = key;
                    }
                  }
                }
                break place;
              }
            }
          }
        }
      });
      if (foodFitted < this.placed.length) {
        this.placements = [];
        foodFitted = 0;
      }
    }

    // set global game board
    this.board = [...Array(this.boardSize).keys()].reduce(
      (board, y) => [
        ...board,
        ...[...Array(this.boardSize).keys()].reduce(
          (row, x) => [
            ...row,
            { x: x, y: y, food: candidate[x][y], state: "unflipped", icon: "unflipped" }
          ],
          []
        )
      ],
      []
    );
  }

  tileHit(e) {
    const tile = e.detail && e.detail.tile;
    if (tile) {
      this.coins += 1;
      const food = this.foodsPlaced[tile.food];
      food.tiles.push(tile);
      if (food.tiles.length === food.tileCount) {
        food.tiles.forEach(tile => {
          tile.flip();
        });
        if (!this.recipe.ingredients.includes(tile.food)) {
          this.gameState = "lose";
          this.gameLoseReason = `${foods[tile.food].name} is not in your recipe.`;
          this.coins = 0;
          this.nextTurn();
          return;
        }
        this.found++;
        this.coins += food.tileCount;

        if (this.found === this.recipe.ingredients.length) {
          this.gameState = "win";
          this.nextTurn();
          return;
        }

        const numLeft = this.recipe.ingredients.length - this.found;
        this.showModal(
          `food:${tile.food}`,
          `You found ${foods[tile.food].name}!  Just ${numLeft} ${
            numLeft > 1 ? "ingredients" : "ingredient"
          } left.`,
          "Yay!"
        );
      }
    }
    this.nextTurn();
  }

  tileNoHit(e) {
    this.coins -= 2;

    if (this.coins <= 0) {
      this.gameState = "lose";
      this.gameLoseReason = `You've run out of money looking for ingredients.`;
      this.coins = 0;
      this.nextTurn();
      return;
    }

    if (this.coins > 0 && this.coins < 3) {
      this.showModal("game:coins", "Warning You're Almost Out Of Money", "Got It!");
    }

    if (this.coins > 4 && this.coins < 7) {
      this.showModal("game:coins", "Warning You're Running Low On Money", "Got It!");
    }
    this.nextTurn();
  }

  nextTurn() {
    if (this.gameState === "lose") {
      this.showModal("game:lose", this.gameLoseReason, "Play Again?", () => {
        this.resetGame();
      });
      return;
    }

    if (this.gameState === "win") {
      this.showModal(
        "game:coins",
        `Congratulations!  You Won with ${this.coins} coins!`,
        "Play Again?",
        () => {
          this.resetGame();
        }
      );
      return;
    }
  }

  showModal(icon, message, button, onclose) {
    this.modalIcon = icon;
    this.modalMessage = message;
    this.modalButton = button;
    this.modalClick = onclose;
    this.modalVisible = true;
  }

  handleModalClick(e) {
    if (typeof this.modalClick === "function") {
      this.modalClick();
    }
    this.modalVisible = false;
  }

  ready() {
    super.ready();
    this.addEventListener("hit", this.tileHit);
    this.addEventListener("nohit", this.tileNoHit);
  }
}
customElements.define("game-board", GameBoard);
