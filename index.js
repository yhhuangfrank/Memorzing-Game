// - 宣告撲克牌花色(首字母大寫來表示資料不變)
const Symbols = [
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png", //- 黑桃
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png", //- 愛心
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png", //- 方塊
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png", //- 梅花
];
const utility = {
  //! 洗牌演算法(輸入總共有多少牌)
  getRandomCards(count) {
    //- 製作一個與count個數相同陣列
    let number = Array.from(Array(count).keys());
    //* 最後一張到頂部第二張
    for (let index = number.length - 1; index > 0; index -= 1) {
      //- 讓每一張跟前面任一張交換(index + 1，多一種自己跟自己交換的可能)
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};

//- 宣告遊戲各狀態
const GAME_STAGE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  MatchSuccess: "MatchSuccess",
  MatchFail: "MatchFail",
  GameFinish: "GameFinish",
};

//- 定義view物件，包裝顯示卡片所需function
//- 方便日後查看function是包裝在哪裡
const view = {
  //*獲取卡片資訊(區分為卡面與卡片內容)
  getCardContent(index) {
    //- 根據參數來設定卡牌數字與花色(0-51)
    //* 0-12 黑桃、13-25 愛心、26-38 方塊、39-51 梅花
    //* 數字為輸入值除以13的餘數+1
    //* 透過呼叫物件其他function來針對AJQK改變顯示數字
    const number = this.transformNum((index % 13) + 1);
    //* 花色為商的無條件捨去對應Symbol陣列
    const symbol = Symbols[Math.floor(index / 13)];
    return `
      <p>${number}</p>
      <img
        class="card-img"
        src=${symbol}
        alt="card-img"
      />
      <p>${number}</p>
    `;
  },
  getCardElement(index) {
    //- 洗牌後預設呈現背面，透過dataset來傳遞index，進而獲得卡片內容
    return `
    <div class="card back" data-index="${index}">
    </div>
    `;
  },
  //- property和function同名，可省略property命名
  //*顯示卡片
  displayCard(arr) {
    const rootElement = document.querySelector("#cards-container");
    //- 產生一數字陣列並填入template literal(使用keys迭代)
    rootElement.innerHTML = arr
      .map((index) => this.getCardElement(index))
      .join("");
  },

  //* 透過特定case轉換A,J,Q,K
  transformNum(number) {
    switch (number) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      default:
        return number;
    }
  },
  filpCard(card) {
    console.log(card);
    const cardIndex = Number(card.dataset.index);
    //- 希望得知card上是否有back的class(背面)
    if (card.classList.contains("back")) {
      //- 顯示卡面內容
      card.classList.remove("back");
      card.innerHTML = view.getCardContent(cardIndex);
    } else {
      card.classList.add("back");
      card.innerHTML = null;
    }
  },
  //- 設定配對成功樣式
  paired(cards) {
    console.log(cards);
    cards.forEach((card) => {
      card.classList.add("paired");
    });
  },
  pairFailed(cards) {
    console.log(cards);
    setTimeout(() => {
      cards.forEach((card) => {
        this.filpCard(card);
      });
    }, 1000);
  },
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },
  renderTriedTime(time) {
    document.querySelector(
      ".tried"
    ).textContent = `You've tried: ${time} times`;
  },
  wrongAniamtion(cards) {
    cards.map((card) => {
      card.classList.add("wrong");
      //- 使用once true表示監聽器每次只使用一次
      card.addEventListener("animationend", () => {
        card.classList.remove("wrong"), { once: true };
      });
    });
  },
  showComplete(score, time) {
    const header = document.querySelector("#header");
    let div = document.createElement("div");
    div.innerHTML = `
      <div id="complete">
      <h3>Complete Game!</h3>
      <p>Your Score: ${score}</p>
      <p>You've tried: ${time} times</p>
      <div>
        <button class="btn btn-dark" id="retryBtn" onclick="window.location.reload()">
          <i class="fa-solid fa-rotate-right"></i></button
        ><span>Try Again!</span>
      </div>
    </div>
    `;
    header.before(div);
  },
};
//- 控制遊戲流程(方便得知目前遊戲進行且易維護)
const controller = {
  currentState: GAME_STAGE.FirstCardAwaits,
  //-透過controller統一呼叫view的function與utility
  //-降低view與utility耦合程度
  generateCards() {
    view.displayCard(utility.getRandomCards(52));
  },
  //- 依照不同state分配工作
  dispatchCardAction(card) {
    //* 若牌面已經翻開，則不做事
    if (!card.classList.contains("back")) {
      return;
    }
    switch (this.currentState) {
      case "FirstCardAwaits":
        this.currentState = GAME_STAGE.SecondCardAwaits;
        view.filpCard(card);
        model.revealedCards.push(card);
        break;
      case "SecondCardAwaits":
        //- 嘗試次數+1
        model.triedTime += 1;
        view.renderTriedTime(model.triedTime);
        //- 第二張比對開始
        view.filpCard(card);
        model.revealedCards.push(card);
        const revealedCards = model.revealedCards;
        //- 配對成功
        if (model.isRevealedCardMatch()) {
          view.renderScore((model.score += 10));
          this.currentState = GAME_STAGE.MatchSuccess;
          view.paired(revealedCards);
          //-配對成功且完成遊戲
          if (model.score === 260) {
            controller.currentState = GAME_STAGE.GameFinish;
            view.showComplete(model.score, model.triedTime);
            return;
          }
          //- 配對失敗
        } else {
          this.currentState = GAME_STAGE.MatchFail;
          view.wrongAniamtion(revealedCards);
          view.pairFailed(revealedCards);
        }
        //-切換回初始狀態
        this.currentState = GAME_STAGE.FirstCardAwaits;
        model.revealedCards = [];
        break;
    }
    console.log("currentState is " + this.currentState);
    console.log(model.revealedCards);
  },
};

//- 資料管理
const model = {
  //- 翻開的卡面紀錄
  revealedCards: [],
  //- 翻的卡是否相同
  isRevealedCardMatch() {
    const card = this.revealedCards;
    if (
      Number(card[0].dataset.index) % 13 ===
      Number(card[1].dataset.index) % 13
    ) {
      return true;
    } else {
      return false;
    }
  },
  //- 初始分數與嘗試次數
  score: 0,
  triedTime: 0,
};

// ! 遊戲流程
controller.generateCards();

// ! 為每張卡片綁上監聽器監聽翻牌動作
const cards = document.querySelectorAll(".card"); //* NodeList
cards.forEach((card) => {
  card.addEventListener("click", function onCard() {
    controller.dispatchCardAction(card);
  });
});
