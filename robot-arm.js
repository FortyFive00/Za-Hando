/**
 * The robot arm constructor
 * 
 * @param {HTMLCanvasElement} canvas The canvas element used for drawing the robot arm on.
 */
var RobotArm = function (canvas) {
    // So we can reference this when we are inside other functions
    var self = this;
    // This wont be visible to the consumers of the RobotArm instance
    var local = {};
    // The Canvas2DContext we can draw with
    var ctx = canvas.getContext("2d");

    // The amount of columns to use
    self.columns = 9;
    // The amount of rows to use
    self.rows = 8;
    // The speed of which the animations go
    self.speed = 50;

    // List of animations
    local.animationList = [];
    // Current animation
    local.currentAnimation = 0;

    // Handles the arm
    local.arm = {};
    // The position of the arm
    local.arm.position = 0;
    // Arm Rendering properties
    local.arm.horizontalOffset = 0;
    local.arm.verticalOffset = 0;
    local.arm.height = 25;
    local.arm.hookHeight = 10;

    // Handles the floor
    local.floor = {};
    // The height of the column separator, set to 0 to remove separators
    local.floor.columnSeparatorHeight = 10;
    // The padding between the blocks and the separators
    local.floor.columnSeparatorPadding = 5;

    // Handles the blocks
    local.blocks = {};
    local.blocks.availableColors = [];
    local.blocks.map = null;
    local.blocks.held = null;
    
    // State variables
    local.state = {};
    // Arm
    local.state.arm = {};
    local.state.arm.position = local.arm.position;
    // Blocks 
    local.state.blocks = {};
    local.state.blocks.map = null;
    local.state.blocks.held = null;

    // Handles the settings
    local.settings = {};
    // The background color of the robot arm canvas
    local.settings.backgroundColor = "#EEE";
    // The colors of the columns
    local.settings.coloredColumns = [];
    // If some of the columns are colored
    local.settings.hasColoredColumns = false;

    local.settings.snapColor = '';

    local.getAvailableTotalRowsHeight = function () {
		return ctx.canvas.height - local.arm.height - local.arm.hookHeight;
	};

    local.copyMap = function (map) {
        var newMap = [];
		for (var i = 0; i < map.length; i++) newMap.push(map[i].slice());
		return newMap;
    };

    var runTime;
    /**
     * Renders all of the robot arm
     */
    local.render = function () {
        var now = new Date().getTime();
		var dt = now - (runTime || now);
        // Clear surface to start a new frame
        ctx.beginPath();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw the background
        ctx.fillStyle = local.settings.backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Do animation
        if (local.animationList.length > local.currentAnimation && local.animationList[local.currentAnimation](dt != 0 ? dt : 9999999)) {
            local.currentAnimation++;
        }

        // Render all
        local.renderFloor();
        local.renderArm();
        local.renderBlocks();

        // Draw everything
        ctx.stroke();
        ctx.stroke();

        runTime = now;

        requestAnimationFrame(local.render);
    };

    local.renderFloor = function () {
        // Save state and restore after rendering
        ctx.save();

		// Draw columns
		var columnWidth = ctx.canvas.width / self.columns;
		for (var i = 0; i < self.columns + 1; i++) {
		    if(local.settings.coloredColumns.length-1 >= i){
		        if(local.settings.coloredColumns[i]) {
		            var color = local.settings.coloredColumns[i];
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 1;

                    // draw arrow
                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.moveTo((columnWidth * i) + ((columnWidth / 3) * 2), 20);
                    ctx.lineTo((columnWidth * i) + (columnWidth / 2), 20+15);
                    ctx.lineTo((columnWidth * i) + ((columnWidth / 3)), 20);
                    ctx.lineTo((columnWidth * i) + ((columnWidth / 3) * 2), 20);
                    ctx.fill();
                    ctx.stroke();


                    ctx.lineWidth = local.floor.columnSeparatorHeight;
                    ctx.strokeStyle = color;

                    local.settings.hasColoredColumns = true;
                }
            }else{
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
            }

		    // draw bottom
            ctx.beginPath();
            ctx.moveTo(i * columnWidth, ctx.canvas.height);
            ctx.lineTo((i+1) * columnWidth, ctx.canvas.height);
            ctx.stroke();

            //draw separator
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.beginPath();
			ctx.moveTo(i * columnWidth, ctx.canvas.height);
			ctx.lineTo(i * columnWidth, ctx.canvas.height - local.floor.columnSeparatorHeight);
            ctx.stroke();
		}
        // Restore after rendering arm
        ctx.restore();
    };

    local.renderArm = function () {
        // Save state and restore after rendering
        ctx.save();
        // Set drawing color to black
        ctx.strokeStyle = "#000";

        var columnWidth = ctx.canvas.width / self.columns;
		var columnXPosForCurrentColumn = local.arm.position * columnWidth;
		var blockWidth = (ctx.canvas.width / self.columns) - local.floor.columnSeparatorPadding * 2;

		ctx.moveTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + columnWidth / 2, 0);
		ctx.lineTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + columnWidth / 2, local.arm.height + local.arm.verticalOffset);

		ctx.moveTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + local.floor.columnSeparatorPadding, local.arm.height + local.arm.verticalOffset);
		ctx.lineTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + columnWidth - local.floor.columnSeparatorPadding, local.arm.height + local.arm.verticalOffset);

		ctx.moveTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + local.floor.columnSeparatorPadding, local.arm.height + local.arm.verticalOffset);
		ctx.lineTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + local.floor.columnSeparatorPadding, local.arm.height + local.arm.hookHeight + local.arm.verticalOffset);

		ctx.moveTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + columnWidth - local.floor.columnSeparatorPadding, local.arm.height + local.arm.verticalOffset);
		ctx.lineTo(local.arm.horizontalOffset + columnXPosForCurrentColumn + columnWidth - local.floor.columnSeparatorPadding, local.arm.height + local.arm.hookHeight + local.arm.verticalOffset);

        if (local.blocks.held != null) {
            var x = local.arm.horizontalOffset + columnXPosForCurrentColumn + local.floor.columnSeparatorPadding + 1;
            var y = local.arm.height + local.arm.verticalOffset + 1;
            var blockHeight = local.getAvailableTotalRowsHeight() / self.rows;

            local.renderSingleBlock(x,y,blockWidth-2,blockHeight, local.blocks.held);
		}

        // Restore after rendering arm
        ctx.restore();
    };

    local.renderBlocks = function () {
        // Save state and restore after rendering
        ctx.save();
        // Calculate some values to know where to draw and how large
		var columnWidth = ctx.canvas.width / self.columns;
		var blockHeight = local.getAvailableTotalRowsHeight() / self.rows;
		var blockWidth = (ctx.canvas.width / self.columns) - local.floor.columnSeparatorPadding * 2;

		// For every block do
		for (var column = 0; column < local.blocks.map.length; column++) {
			var col = local.blocks.map[column];
			if (!col) continue;
			for (var row = 0; row < col.length; row++) {
				//console.log("Column: " + column + " Row: " + row + " has color " + local.blocks.map[column][row]);
				// Base position of the column we are working with (used for calculating the padding)
				var columnXPosForCurrentColumn = column * columnWidth;
				// Drawing the inner color of the rectangle

                var y = ctx.canvas.height - blockHeight * (row + 1) - 1;
                var x = columnXPosForCurrentColumn + local.floor.columnSeparatorPadding ;

                local.renderSingleBlock(x,y,blockWidth,blockHeight, local.blocks.map[column][row]);

			}
		}
        // Restore after rendering arm
        ctx.restore();
    };

    local.renderSingleBlock = function(x,y,width,height,filling){
        // Set the stroke color to black
        ctx.strokeStyle = "#000";
        // Drawing the outer rectangle
        ctx.rect(x, y, width, height);

        if(!isNaN(parseFloat(filling)) && isFinite(filling)){
            ctx.font = ((height/3)*2)+'px Verdana';
            ctx.fillStyle = "#000";
            ctx.textAlign = 'center';
            ctx.fillText(filling, x+(width/2), y+(height/6)*4.5);
        }else{
            ctx.fillStyle = filling;
            ctx.fillRect(x + 1, y, width,height - 1);
        }
    };

    local.moveRightAnimation = function (dt) {
        local.arm.horizontalOffset += (self.speed * ctx.canvas.width) / 1000 / dt;

        if (local.arm.horizontalOffset <= ctx.canvas.width / self.columns) {
            return false;
        }

        local.arm.horizontalOffset = 0;
        local.arm.position++;
        return true;
    };

    local.moveLeftAnimation = function (dt) {
        local.arm.horizontalOffset -= (self.speed * ctx.canvas.width) / 1000 / dt;

        if (local.arm.horizontalOffset * -1 <= ctx.canvas.width / self.columns) {
            return false;
        }

        local.arm.horizontalOffset = 0;
        local.arm.position--;
        return true;
    };

    local.grabAnimation = function (dt) {
        if (!this.isMovingUp) {
            if (local.moveArmDownAnimation(dt)) {
                this.isMovingUp = true;
                if (local.blocks.map[local.arm.position] && local.blocks.map[local.arm.position].length > 0) {
                    local.blocks.held = local.blocks.map[local.arm.position][local.blocks.map[local.arm.position].length - 1];
                    var row = local.blocks.map[local.arm.position];
                    var blocksInRow = row.length;
                    row.splice(blocksInRow - 1, 1);
                }
            }
            return false;
        }
        if (local.moveArmUpAnimation(dt)) {
            this.isMovingUp = false;
            return true;
        }
    };

    local.dropAnimation = function (dt) {
        if (!this.isMovingUp) {
            if (local.moveArmDownAnimation(dt)) {
                this.isMovingUp = true;
                if (local.blocks.held != null) {
                    if (!local.blocks.map[local.arm.position]) local.blocks.map[local.arm.position] = [];
                    local.blocks.map[local.arm.position].push(local.blocks.held);
                    local.blocks.held = null;
                }
            }
            return false;
        }
        if (local.moveArmUpAnimation(dt)) {
            this.isMovingUp = false;
            return true;
        }
    }

    local.moveArmDownAnimation = function (dt) {
        local.arm.verticalOffset += (self.speed * 2 * ctx.canvas.height) / 1000 / dt;

        var rowsForCurrentColumn = (local.blocks.map[local.arm.position] != undefined ? local.blocks.map[local.arm.position] : []).length;
		var blockHeight = local.getAvailableTotalRowsHeight() / self.rows;

        if (local.blocks.held != null) rowsForCurrentColumn++;

        var blocksTotalHeight = rowsForCurrentColumn * blockHeight;
		var distanceToTravel = ctx.canvas.height - blocksTotalHeight - local.arm.height - 3;

        if (distanceToTravel >= local.arm.verticalOffset) {
            return false;
        }

        return true;
    };

    local.moveArmUpAnimation = function (dt) {
        local.arm.verticalOffset -= (self.speed * 2 * ctx.canvas.height) / 1000 / dt;

        if (0 <= local.arm.verticalOffset) {
            return false;
        }

        local.arm.verticalOffset = 0;
        return true;
    };

    self.setColors = function(colors){
        local.blocks.availableColors = colors;
    };

    self.getColors = function(){
        return local.blocks.availableColors;
    };

    self.snap = function () {
        if(self.scanBlock() === null){
            for (var i =0; i<local.blocks.map.length; i++) {
                local.blocks.map[i] = local.blocks.map[i].filter(function (value) {
                    return value != local.settings.snapColor;
                });
            }
        }
    };

    local.shuffleArray = function(array){
        for (i = array.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = array[i];
            array[i] = array[j];
            array[j] = x;
        }

        return array;
    };

    /**
     * Moves the robot arm one position to the right if possible
     * 
     * @returns
     */
    self.moveRight = function () {
        // Don't do anything if we would move out of the columns
        if (local.arm.position + 1 > self.columns) return;
        local.animationList.push(local.moveRightAnimation);
        local.state.arm.position++;
    };
    /**
     * Moves the robot arm one position to the left if possible
     */
    self.moveLeft = function () {
        if (local.state.arm.position - 1 < 0) return;
        local.animationList.push(local.moveLeftAnimation);
        local.state.arm.position--;
    };
    /**
     * Returns the color of the held block, if any
     * @returns {null|string} The name of the color of the block that is being held 
     */
    self.scan = self.scanBlock = function () {
        return local.state.blocks.held || null;
    };

    /**
     * Returns the color of the held block, if any
     * @returns {null|string} The name of the color of the block that is being held
     */
    self.scanColumn = function () {
        return local.settings.coloredColumns[local.state.arm.position] || null;
    };

    /**
     * Grabs a block from beneath, if possible
     */
    self.grab = function(){
        if (local.state.blocks.held == null) {
            local.animationList.push(local.grabAnimation);
            if (local.state.blocks.map[local.state.arm.position] && local.state.blocks.map[local.state.arm.position].length > 0) {
                local.state.blocks.held = local.state.blocks.map[local.state.arm.position][local.state.blocks.map[local.state.arm.position].length - 1];
                var row = local.state.blocks.map[local.state.arm.position];
                var blocksInRow = row.length;
                row.splice(blocksInRow - 1, 1);
            }
        }
    };

    local.dropBlock = function () {
        local.animationList.push(local.dropAnimation);
        if (local.state.blocks.held != null) {
            if (!local.state.blocks.map[local.state.arm.position]) local.state.blocks.map[local.state.arm.position] = [];
            local.state.blocks.map[local.state.arm.position].push(local.state.blocks.held);
            local.state.blocks.held = null;
        }
    };

    /**
     * Drops a block beneath, if possible
     */
    self.drop = function(){
        if(!local.settings.hasColoredColumns){
            local.dropBlock();
        } else {
            var color = self.scanBlock();
            local.dropBlock();

            if (color != null && color !== self.scanColumn()) {
                console.log('Error!')
                self.grab();
                return false;
            }
        }

        return true;
    };

    self.setMap = function (map) {
        local.blocks.map = map.slice();
        local.state.blocks.map = local.copyMap(map);
    };

    self.loadLevel = function(levelName) {
        switch (levelName) {
            case "exam 3":


                break;



            default:
                throw new Error("There is no level with the name: " + levelName);
        }
    };

    self.examLevel = function (level) {
        var map = [];

        switch (level) {

            case 1:
                self.columns = 7;
                local.arm.position = 0;
                local.state.arm.position = 0;

                var numbers = [6,5,4,3,2,1];

                while (numbers[0] == 6){
                    local.shuffleArray(numbers);
                }

                map[0] = numbers;
                break;

            case 2:
                var colors = ["red", "blue", "yellow", "green"];

                self.columns = 9;
                local.arm.position = 4;
                local.state.arm.position = 4;

                var coloredColumns = [0,1,7,8];
                for(var i=0;i<colors.length;i++){
                    local.settings.coloredColumns[coloredColumns[i]] = colors[i];
                }


                map[0] = [];
                map[1] = [];
                map[2] = [];
                map[3] = [];
                map[4] = [];
                for (var i=0; i<6; i++){
                    local.shuffleArray(colors);
                    map[4].push(colors[0]);
                }

                break;

            case 3:
                var rawColors = ["red", "blue", "yellow", "green", "orange", "purple", "gray", "black"];
                colors = [];

                local.shuffleArray(rawColors);
                for (var i=0; i<4; i++){
                    colors.push(rawColors[i]);
                }
                
                local.shuffleArray(rawColors);
                local.shuffleArray(colors);

                self.columns = 10;
                local.arm.position = 9;
                local.state.arm.position = 9;

                for(var i=0;i<rawColors.length;i++){
                    local.settings.coloredColumns[i+1] = rawColors[i];
                }

                map[0] = [];
                map[1] = [];
                map[2] = [];
                map[3] = [];

                for (var i=0; i<2; i++){
                    local.shuffleArray(colors);
                    for (var j=0; j<4; j++){
                        map[0].push(colors[j]);
                    }
                }

                local.state.scannedColumns = [];
                local.scanColumnOrignal = self.scanColumn;
                self.scanColumn = function () {
                    if(local.state.scannedColumns.indexOf(local.state.arm.position) == -1){
                        local.state.scannedColumns.push(local.state.arm.position);
                        return local.scanColumnOrignal();
                    }

                    return null;
                };

                break;

            case 4:
                var rawColors = ["red", "blue", "yellow", "green", "orange", "purple", "gray", "black"];
                colors = [];

                local.shuffleArray(rawColors);
                for (var i=0; i<4; i++){
                    colors.push(rawColors[i]);
                }

                local.shuffleArray(colors);

                self.columns = 9;
                local.arm.position = 4;
                local.state.arm.position = 4;

                for(var i=0;i<colors.length;i++){
                    local.settings.coloredColumns[i+5] = colors[i];
                }

                map[0] = [];
                map[1] = [];
                map[2] = [];
                map[3] = [];

                for (var i=3; i>=0; i--){
                    local.shuffleArray(colors);
                    for (var j=0; j<(i+1); j++){
                        map[i].push(colors[j]);
                    }
                }

                break;



            case 5:
                self.columns = 3;
                local.arm.position = 0;
                local.state.arm.position = 0;

                map[0] = [3,1,2,4,5];
                break;


            case 6:
                var colors = ["red", "blue", "yellow", "green"];
                local.shuffleArray(colors);

                self.columns = 9;
                local.arm.position = 4;
                local.state.arm.position = 4;

                var coloredColumns = [0,1,7,8];
                for(var i=0;i<colors.length;i++){
                    local.settings.coloredColumns[coloredColumns[i]] = colors[i];
                }

                map[0] = [];
                map[1] = [];
                map[2] = [];
                map[3] = [colors[0], colors[1], colors[2]];
                map[4] = [colors[3], colors[0], colors[3]];
                map[5] = [colors[2], colors[1], colors[0]];

                break;

            case 7:
                var rawColors = ["red", "blue", "yellow", "green", "orange", "purple", "gray", "black"];
                colors = [];

                local.shuffleArray(rawColors);
                for (var i=0; i<4; i++){
                    colors.push(rawColors[i]);
                }

                var map = [];
                map[0] = [];
                map[1] = [];
                map[2] = [];
                map[3] = [];
                map[4] = [];

                var amount = Math.floor(Math.random() * Math.floor(6))+2;
                var columnColors = [];

                for (var b=0; b<=amount; b++){
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    if(columnColors.indexOf(color) == -1){
                        columnColors.push(color);
                    }

                    map[0][b] = color;
                }

                for(var i=0;i<columnColors.length;i++){
                    local.settings.coloredColumns[i+1] = columnColors[i];
                }

                break;

            case "thanos":
            case 8:
                self.columns = 10;
                local.arm.position = 0;
                local.state.arm.position = 0;
                local.settings.coloredColumns[9] = "#a760ad";
                local.settings.snapColor = '#7e787f';

                map[0] = ["#a760ad", "#a760ad", '#7e787f'];
                map[1] = ["#a760ad", '#7e787f', '#7e787f'];
                map[2] = ["#a760ad", "#a760ad", '#7e787f'];
                break;

            default:
                throw new Error("There is no level with the name: " + level);

        }

        self.setMap(map);
	};

    /**
     * Waits for a certain amount of time.
     */
    // self.wait = function () {
    //     local.mainMovementFunc(this);
    // };
    self.run = function () {
        // Render frames
        requestAnimationFrame(local.render);
    };
};
