


const playerStats = require("../_unused/playerStats");

(function (exports) {

    const _default = {
        totalGames: 0,
        pickCard: 0,
        turns: 0,
        longest: 0,
        playerList: []
    };

    function assignDefault(o) {
        return assign(_default, o);
    }

    function assign(o1, o2) {
        return Object.assign({}, o1, o2);
    }


    exports.stats = class stats {
        constructor(prm) {

            prm = assignDefault(prm);
            this.totalGames = prm.totalGames;
            this.pickCard = prm.pickCard;
            this.turns = prm.turns;
            this.longest = prm.longest;

            this.playerList = prm.playerList;
            this.orderScore();
        }
        reset(){
            this.totalGames = 0;
            this.pickCard = 0;
            this.turns = 0; // je to včetně smoliz tahů !! 
            this.longest = 0;

            this.playerList = [];
        }
        /// řazaní pole podle podmínky.. 
        orderScore() {
            // todo - seřadit this.playerList
            // this.playerList.sort((a, b) => {
            //     return b.wins - a.wins;
            // });

            this.playerList.sort((a, b) => b.wins - a.wins);

        }

        incScoreStart(prm) {
            this.totalGames++;

            var inArray = false;
            for (var i = 0; i < prm.length; i++) {
                var item = prm[i];
                inArray = false;

                for (var c = 0; c < this.playerList.length; c++) {
                    if (this.playerList[c].name == item.name) {
                        inArray = true;
                        this.playerList[c].games++; 
                    }
                }
                if (!inArray) {
                    var ps = new playerStats.playerStats({ name: item.name });
                    ps.games++; 
                    this.playerList.push(ps);
                }
            }
        }

        incScoreEnd(prm) {
            this.turns += prm.turns;
            this.pickCard += prm.pickCard;

            if (this.longest < prm.turns)
                this.longest = prm.turns;

            if (prm.won != "") {
                for (var c = 0; c < this.playerList.length; c++) {
                    if (this.playerList[c].name == prm.won) {
                        this.playerList[c].wins++; // todo - nevím proč nejel addPoint ?
                    }
                }
            }

            this.orderScore();
        }

        // get json - db save
        getJson() {
            return JSON.stringify(this);
        }

        // load json from db
        loadJson(data) {
            var prm = JSON.parse(data);
            prm = assignDefault(prm);

            this.totalGames = prm.totalGames;
            this.pickCard = prm.pickCard;
            this.turns = prm.turns;
            this.playerList = prm.playerList;
            this.orderScore();
        }

        toString() {
            return JSON.stringify(this);
        }

    }
})(exports);


