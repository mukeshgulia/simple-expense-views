//Control the budget calculation
var controlBudget = ( function(){
    
    class Expenditure {
        constructor(id, description, value, percentage) {
            this.id = id;
            this.description = description;
            this.value = value;
            this.percentage = -1;
        }
        calculatePercentage(income) {
            if (income > 0) {
                this.percentage = Math.round((this.value / income) * 100);
            }
            else {
                this.percentage = -1;
            }
        }
        getPercentage() {
            return this.percentage;
        }
    }
    
    
    
    class Income {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
        }
    }
    

    var store = {
        allItems : {
            inc: [],
            exp: []
        },
        totals : {
            inc: 0,
            exp: 0
        },
        budget: 0,
        percentage: -1
    };
    
    var manageStore = function(type) {
        
        //console.log('Inside calculate total for:'+type)
        var sum = 0;
        store.allItems[type].forEach(function(current){
           // console.log('Summing the value:'+current.value);
            sum += current.value;
        });
        
        store.totals[type] = sum;
    };
    
    return {
        addItem: function(type, desc, val) {
            var item, id;
            
            //Increment id
            if(store.allItems[type].length > 0){
                id = store.allItems[type][store.allItems[type].length - 1].id + 1;
            }else{
                id = 0;
            }
            
            //Create new item based on 'inc' or 'exp' type
            if(type === 'exp') {
                item = new Expenditure(id, desc, val);         
            } else if(type === 'inc') {
                item = new Income(id, desc, val);
            }
            
            //Push it to store structure
            store.allItems[type].push(item);
            store.totals[type] += val;
            
            return item;
        },
        
        deleteItem: function(type, id){
            
            var ids, index;            
            ids = store.allItems[type].map(function(current){
                return current.id;
            });
            
            index = ids.indexOf(id);
            if(index !== -1){
                store.allItems[type].splice(index,1);   
            }
        },
        
        calcuateBudget: function() {
            
           // console.log('inside calculate budget');
            //1. Calcualte total income and expenses
            manageStore('exp');
            manageStore('inc');
            
            //2. Calcualte budget: income - expenses
            store.budget = store.totals.inc - store.totals.exp;
            
            //3. Calculate percentage of income that we spend
            if(store.totals.inc > 0){
                store.percentage = Math.round((store.totals.exp / store.totals.inc) * 100);    
            } else{
                store.percentage = -1;
            }
            
        },
        
        calculatePercentages: function(){
            store.allItems.exp.forEach(function(current){
               current.calculatePercentage(store.totals.inc) 
            });
        },
        
        getPercentages : function(){
            var allPerc = store.allItems.exp.map(function(current){
               return current.getPercentage() 
            });
            
            return allPerc;
        },
        
        getBudget: function(){
            return{
                budget: store.budget,
                totalInc: store.totals.inc,
                totalExp: store.totals.exp,
                percentage: store.percentage
            };
        },
        testing: function(){
            console.log(store);
        }       

    };
    
})();


//UI CONTROLLER
var controlFrontEnd = (function(){
    
    var FromDOM = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercentageLabel : '.item__percentage',
        monthLabel : '.budget__title--month'
    };
    
    var formatNumner = function(num, type){
            
            /* + or -- before numner
                exactly 2 decimal points
                comma seperating the thousands
            */
            var num, int, dec;
            num = Math.abs(num);
            num = num.toFixed(2);
            numSplit = num.split('.');
             
            int = numSplit[0];
            if(int.length > 3){
                int = int.substr(0,int.length - 3) + ',' + int.substr(int.length - 3,3);
                
            }
            dec = numSplit[1];
            
            return (type === 'exp' ? '-': '+') + ' ' + int + '.' + dec;
    }

    var nodeListForEach = function(list, callback){
        for(var i=0; i <list.length; i++){
            callback(list[i],i);
        }
    };
    
    return {
        getInput: function() {
            return{
                type: document.querySelector(FromDOM.inputType).value, //will be either inc,or exp
                description: document.querySelector(FromDOM.inputDescription).value,
                value: parseFloat(document.querySelector(FromDOM.inputValue).value)
            };
        },
        
        addListItem: function(obj, type) {
            
            var html, newHtml, element;
            
            if(type === 'inc') {
                
                element = FromDOM.incomeContainer;
                //1. Create HTML string with placeholder tags
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';                
            }else if(type === 'exp'){
                element = FromDOM.expenseContainer;
                
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
    
            }
            
                
            //2. Replace placeholder tags wiht some actual store
            newHtml = html.replace('%id%',obj.id);
            newHtml = newHtml.replace('%description%',obj.description);
            newHtml = newHtml.replace('%value%',formatNumner(obj.value, type));
            
            
            //3. Insert HTML into DOM
            document.querySelector(element).insertAdjacentHTML('beforeend',newHtml);
        },
        
        deleteListItem: function(itemId){
            var el = document.getElementById(itemId);
            el.parentNode.removeChild(el);
        },
        
        clearFields: function(){
            var fields, fieldsArr;
            fields =  document.querySelectorAll(FromDOM.inputDescription + ', ' + FromDOM.inputValue); //returns a list
            
            //HACK
            fieldsArr = Array.prototype.slice.call(fields);
            
            fieldsArr.forEach(function(current, index, array){
                current.value = '';
            });
            
            fieldsArr[0].focus();
        },
        
        displayBudget: function(obj){
            var type;
            
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            
            document.querySelector(FromDOM.budgetLabel).textContent = formatNumner(obj.budget, type);
            document.querySelector(FromDOM.incomeLabel).textContent = formatNumner(obj.totalInc, 'inc');
            document.querySelector(FromDOM.expensesLabel).textContent = formatNumner(obj.totalExp,'exp');
            
            if(obj.percentage > 0){
                document.querySelector(FromDOM.percentageLabel).textContent = obj.percentage+'%';
            }else{
                document.querySelector(FromDOM.percentageLabel).textContent = '---';    
            }   
            
        },
        
        displayPercentages: function(percentages){
            var fields = document.querySelectorAll(FromDOM.expensesPercentageLabel);
            
            nodeListForEach(fields,function(current, index){
                
                var percentage = percentages[index];
                if(percentage > 0){
                    current.textContent = percentages[index] + '%';    
                } else{
                    current.textContent = '---';    
                }
                
            });
        },
        
        displayMonth : function(){
            var now, year, month, months;
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            
            now = new Date();
            month = now.getMonth();
            year = now.getFullYear();
            
            document.querySelector(FromDOM.monthLabel).textContent = months[month] + ' ' + year;
        },
        
        changedType: function(){
            var fields = document.querySelectorAll(
                FromDOM.inputType + ', ' + 
                FromDOM.inputDescription + ', ' + 
                FromDOM.inputValue);
            
            nodeListForEach(fields, function(cur){
                cur.classList.toggle('red-focus');
            });
            
            document.querySelector(FromDOM.inputBtn).classList.toggle('red');
        },
        
        getFromDOM: function(){
            return FromDOM;
        }

    };
    
    
})();


//GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, uiCtrl){

    //Not a good practice to directly use controlBudget module
    //controlBudget.publicTest
    
    var initEventListners = function(){
        
        var DOM = uiCtrl.getFromDOM();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.querySelector(DOM.container).addEventListener('click',ctrlDeleteItem);

        document.addEventListener('keypress', function(event){

            if(event.keyCode === 13 || event.which === 13){
                ctrlAddItem();
            }
        });
        
        document.querySelector(DOM.inputType).addEventListener('change', uiCtrl.changedType);    
        
    };
    
    
    var updateBudget = function(){

        var budget;
        //1. Calculate the budget
        budgetCtrl.calcuateBudget();
        
        //2. Return the budget
        budget = budgetCtrl.getBudget();
        
        //3. Display the budget
        uiCtrl.displayBudget(budget);
    
    };
    
    var updatePercentages = function(){
        
        var percentage;
        //1.Calculate percentages
        budgetCtrl.calculatePercentages();
        
        //2 Read from budget
        var percentages = budgetCtrl.getPercentages();
        
        //3 Update the user interface
        uiCtrl.displayPercentages(percentages);
    };
    
    var ctrlAddItem = function(){
        
        var input, item;
        //1. Get the field input store
        input = uiCtrl.getInput();
        
        if(input.description !== '' && !isNaN(input.value) && input.value > 0){
            //2. Add the item to budget controller
            item = budgetCtrl.addItem(input.type,  input.description, input.value)

            //3. Add new item to user interface
            uiCtrl.addListItem(item,input.type);

            //4 Clear the fields
            uiCtrl.clearFields();

            //5. Calculate and update budget
            updateBudget();  
            
            //6. Calcualte and update percentages
            updatePercentages();
        }     
    };
    
    var ctrlDeleteItem = function(event){
        
        var itemId, type, id;
        
        itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        if(itemId){
            
            splitId = itemId.split('-');
            type = splitId[0];
            id = parseInt(splitId[1]);
            
            //1. Delete item from store structure
            budgetCtrl.deleteItem(type,id);
            
            //2 Delete item from user interface
            uiCtrl.deleteListItem(itemId);
            
            //3. Update and show new budget
            updateBudget();
            
            //4. Calcualte and update percentages
            updatePercentages();
        }
        
    };
    
    return{
        init: function(){
            //console.log('Application has started...');
            uiCtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            
            uiCtrl.displayMonth();
            
            initEventListners();      
        }
    };
    
    
})(controlBudget,controlFrontEnd);

controller.init();