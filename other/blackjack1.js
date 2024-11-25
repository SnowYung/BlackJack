let dealarSum = 0; // 赌场的总点数
let yourSum = 0; // 玩家（你的）总点数

let dealerAceCount = 0; // 赌场的A牌数量
let yourAceCount = 0; // 玩家（你的）A牌数量

let hidden; // 赌场隐藏的牌
let deck; // 扑克牌组

let canHit = true; //允許玩家（你）在 yourSum <= 21 時進行抽牌

window.onload = function() {
    buildDeck(); // 建立一副牌
    shuffleDeck(); // 洗牌
    startGame(); // 开始游戏
}

function buildDeck() {
    let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]; // 定义牌的点数
    let types = ["C", "D", "H", "S"]; // 定义花色
    deck = []; // 初始化牌组

    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < values.length; j++) {
            deck.push(values[j] + "-" + types[i]); // 添加牌到牌组中，比如 A-C, K-D
        }
    }
    // 控制台.log(甲板); // 可以通过控制台输出牌组
}

function shuffleDeck() {
    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length); // 随机生成一个索引
        let temp = deck[i]; // 交换
        deck[i] = deck[j];
        deck[j] = temp;
    }
    console.log(deck); // 输出洗完的牌组
}

function startGame() {
    hidden = deck.pop(); // 取出一张牌作为赌场的隐藏牌
    dealarSum += getValue(hidden); // 更新赌场的总点数
    dealerAceCount += checkAce(hidden); // 更新赌场A牌数量
    
    // 当赌场的总点数小于17时，继续抽牌
    while (dealarSum < 17) {
        let cardImg = document.createElement("img"); // 创建img元素
        let card = deck.pop(); // 抽一张牌
        cardImg.src = "./cards/" + card + ".png"; // 设置牌的图像源
        dealarSum += getValue(card); // 更新总点数
        dealerAceCount += checkAce(card); // 更新A牌数量
        document.getElementById("your-cards").append(cardImg); // 将牌添加到页面中
    }
    console.log(dealerSum); // 输出赌场的总点数

    // 玩家抽两张牌
    for (let i = 0; i < 2; i++) {
        let cardImg = document.createElement("img"); // 创建img元素
        let card = deck.pop(); // 抽一张牌
        cardImg.src = "./cards/" + card + ".png"; // 设置牌的图像源
        yourSum += getValue(card); // 更新玩家的总点数
        yourAceCount += checkAce(card); // 更新玩家A牌数量
        document.getElementById("your-cards").append(cardImg); // 将牌添加到页面中
    }

    console.log(yourSum); // 输出玩家的总点数
    document.getElementById("hit").addEventListener("click", hit); // 添加“抽牌”按钮事件
    document.getElementById("stay").addEventListener("click", stay); // 添加“停牌”按钮事件
}

function hit() {
    if (!canHit) { // 如果无法再抽牌，则返回
        return;
    }

    let cardImg = document.createElement("img"); // 创建img元素
    let card = deck.pop(); // 抽一张牌
    cardImg.src = "./cards/" + card + ".png"; // 设置牌的图像源
    yourSum += getValue(card); // 更新玩家的总点数
    yourAceCount += checkAce(card); // 更新玩家A牌数量
    document.getElementById("your-cards").append(cardImg); // 将牌添加到页面中

    if (reduceAce(yourSum, yourAceCount) > 21) { // 如果手牌总点数大于21，禁止再抽牌
        canHit = false;
    }
}

function stay() {
    dealarSum = reduceAce(dealarSum, dealerAceCount); // 根据A牌情况调整赌场的总点数
    yourSum = reduceAce(yourSum, yourAceCount); // 根据A牌情况调整玩家的总点数

    canHit = false; // 禁止再抽牌
    document.getElementById("hidden").src = "./cards/" + hidden + ".png"; // 显示赌场的隐藏牌

    let message = ""; // 用于存储结果消息
    if (yourSum > 21) {
        message = "You Lose!"; // 玩家超出21点
    } else if (dealerSum > 21) {
        message = "You win!"; // 赌场超出21点，玩家胜出
    } else if (yourSum == dealarSum) {
        message = "Tie!"; // 平局
    } else if (yourSum > dealarSum) {
        message = "You Win!"; // 玩家胜出
    } else if (yourSum < dealarSum) {
        message = "You Lose!"; // 玩家失败
    }

    document.getElementById("dealar-sum").innerText = dealarSum; // 显示赌场的点数
    document.getElementById("your-sum").innerText = yourSum; // 显示玩家的点数
    document.getElementById("results").innerText = message; // 显示结果消息
}

function getValue(card) {
    let data = card.split("-"); // "4-C" -> ["4", "C"]
    let value = data[0]; // 取出点数部分

    if (isNaN(value)) { // 如果是非数字牌（A, J, Q, K）
        if (value == "A") {
            return 11; // A初始为11点
        }
        return 10; // J, Q, K均为10点
    }
    return parseInt(value); // 返回点数
}

function checkAce(card) {
    if (card[0] == "A") { // 检查是否为A牌
        return 1; // 返回A牌数量
    }
    return 0; // 不是A牌返回0
}

function reduceAce(playerSum, playerAceCount) {
    while (playerSum > 21 && playerAceCount > 0) { // 如果总点数大于21并且有A牌
        playerSum -= 10; // 将A的点数从11调整为1
        playerAceCount -= 1; // 减少A牌数量
    }
    return playerSum; // 返回调整后的总点数
}