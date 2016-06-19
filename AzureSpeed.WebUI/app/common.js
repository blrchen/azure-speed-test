var cdn = [{ id: 0, name: 'cdn', storage: 'cdn', geo: 'CDN', region: 'CDN', location: 'CDN' }];
// TODO: Remove id
var dc = [
    { id: 1, name: 'eastasia', storage: 'azspdeastasia', geo: 'Asia-Pacific (APAC)', region: 'East Asia', location: 'Hong Kong' },
    { id: 2, name: 'southeastasia', storage: 'azspdsoutheastasia', geo: 'Asia-Pacific (APAC)', region: 'Southeast Asia', location: 'Singapore' },
    { id: 3, name: 'centralus', storage: 'azspdcentralus', geo: 'North America', region: 'Central US', location: 'Iowa' },
    { id: 4, name: 'eastus', storage: 'azspdeastus', geo: 'North America', region: 'East US', location: 'Virginia' },
    { id: 5, name: 'eastus2', storage: 'azspdeastus2', geo: 'North America', region: 'East US 2', location: 'Virginia' },
    { id: 6, name: 'westus', storage: 'azspdwestus', geo: 'North America', region: 'West US', location: 'California' },
    { id: 7, name: 'northcentralus', storage: 'azspdnorthcentralus', geo: 'North America', region: 'North Central US', location: 'Illinois' },
    { id: 8, name: 'southcentralus', storage: 'azspdsouthcentralus', geo: 'North America', region: 'South Central US', location: 'Texas' },
    { id: 9, name: 'northeurope', storage: 'azspdnortheurope', geo: 'Europe (EMEA)', region: 'North Europe', location: 'Ireland' },
    { id: 10, name: 'westeurope', storage: 'azspdwesteurope', geo: 'Europe (EMEA)', region: 'West Europe', location: 'Netherlands' },
    { id: 11, name: 'japanwest', storage: 'azspdjapanwest', geo: 'Asia-Pacific (APAC)', region: 'Japan West', location: 'Osaka Prefecture' },
    { id: 12, name: 'japaneast', storage: 'azspdjapaneast', geo: 'Asia-Pacific (APAC)', region: 'Japan East', location: 'Saitama Prefecture' },
    { id: 13, name: 'brazilsouth', storage: 'azspdbrazilsouth', geo: 'South America', region: 'Brazil South', location: 'Sao Paulo State' },
    { id: 14, name: 'australiaeast', storage: 'azspdaustraliaeast', geo: 'Australia', region: 'Australia East', location: 'New South Wales' },
    { id: 15, name: 'australiasoutheast', storage: 'azspdaustraliasoutheast', geo: 'Australia', region: 'Australia Southeast', location: 'Victoria' },
    { id: 16, name: 'southindia', storage: 'azspdsouthindia', geo: 'India', region: 'South India', location: 'Chennai' },
    { id: 17, name: 'centralindia', storage: 'azspdcentralindia', geo: 'India', region: 'Central India', location: 'Pune' },
    { id: 18, name: 'westindia', storage: 'azspdwestindia', geo: 'India', region: 'West India', location: 'Mumbai' },
    { id: 19, name: 'canadacentral', storage: 'azspdcanadacentral', geo: 'North America', region: 'Canada Central', location: 'Toronto' },
    { id: 20, name: 'canadaeast', storage: 'azspdcanadaeast', geo: 'North America', region: 'Canada East', location: 'Quebec City' },
    { id: 21, name: 'chinaeast', storage: 'azspchinaeast', geo: 'China', region: 'China East', location: 'Shanghai' },
    { id: 22, name: 'chinanorth', storage: 'azspchinanorth', geo: 'China', region: 'China North', location: 'Beijing' },
];

var checkStatusDc = new Array(22);

//checkStatusDc.forEach(function(value,index,))

(function () {
    debugger;
    var menuList = $('.nav.navbar-top-links.navbar-right');
    var filterMenu = menuList.find(".menu-label");
    var filter = menuList.find(".dropdown-extend");
    var listDiv = filter.find(".dropdown-extend-div");
    var button = filter.find("input[type=button]");
    var selAll = filter.find("input[type=checkbox][name=regAll]");
    var selAllLabel = selAll.parent();
    var checkedList = null;
    selAll[0].checked = true;
    for(var i =0 ;i<checkStatusDc.length;i++){
        checkStatusDc[i] = true;
    }

    selAllLabel.click(function () {
        if (selAll[0].checked) {
            $.each(checkedList, function () {
                checkStatusDc[this.value - 1] = this.checked = true;
            });
        } else {
            $.each(checkedList, function () {
                checkStatusDc[this.value - 1] = this.checked = false;
            });
        }
    });
    filterMenu.click(function () {
        //alert("sss");
        var checkIfAllIsChcked = true; 
        $.each(checkedList, function () {
            this.checked = checkStatusDc[this.value - 1];
            if (!checkStatusDc[this.value - 1]) {
                checkIfAllIsChcked = false;
            }          
        });
        selAll[0].checked = checkIfAllIsChcked;
        filter.show();
    });

    filter.mouseleave(function () {
        //alert("sss");
        
        var timeEvent = setTimeout(function () {
            //filter.hide();
            filterClose();
            document.removeEventListener("click", waitForNullClick);
        }, 2000);

        var waitForNullClick = function(){
            //filter.hide();
            filterClose();
            clearTimeout(timeEvent);
            document.removeEventListener("click", waitForNullClick);
        }
        document.addEventListener("click", waitForNullClick);
        //filter.hide();

    });
    
    $.each(dc, function () {

        var div = $("<div></div>").appendTo(listDiv);
        var label = $("<label></label>").appendTo(div);
        var input = $("<input type='checkbox' name='reg' value='" + this.id + "'/>").appendTo(label);
        $("<span> " + this.region + "</span>").appendTo(label);

        checkedList = filter.find("input[type=checkbox][name=reg]");
        });
    button.click(function () {

       // var checkedList = filter.find("input[type=checkbox][name=reg]");
        $.each(checkedList, function () {
           checkStatusDc[this.value - 1] = this.checked;        
        });
        filter.hide();
    });

    var filterClose = function () {
        $.each(checkedList, function () {
            this.checked = checkStatusDc[this.value - 1];
        });
        filter.hide();
    }

 })()