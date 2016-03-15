//var self = require("sdk/self");
var { ToggleButton } = require("sdk/ui/button/toggle");
var { Panel } = require("sdk/panel");
var Windows = require("sdk/window/utils");
var Tabs = require("sdk/tabs/utils");

var button = ToggleButton({
  id: "move-to-window",
  label: "Move To Window",
  icon: {
    "18": "./icon-18.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onChange: function(state){ if(state) listTabs(); }
});

var panel = Panel({
  position: button,
  contentURL: "./panel.html",
  contentScriptFile: "./panel.js",
  contentStyleFile: "./panel.css",
  onHide: function(){
    button.state('window', {checked: false});
    panel.port.emit('panel-hide', 0);
  }
});

var gWins = [];
var gTabs = [];

panel.port.on('log', function(x){ console.log(x); });

function listTabs() {
  var idomwindows = Windows.windows("navigator:browser");
  var idomactivewindow = Windows.getMostRecentBrowserWindow();
  panel.show();

  var obj = {"windows": []};
  gWins = idomwindows;
  gTabs = [];

  idomwindows.forEach(function(win){
    let isCurrentWindow = win === idomactivewindow;
    let w = {"isCurrentWindow": isCurrentWindow, "tabs": []};
    let tabs = Tabs.getTabs(win);

    obj.windows.push(w);
    gTabs.push(tabs);
    tabs.forEach(function(tab){
      let browser = Tabs.getBrowserForTab(tab);

      w.tabs.push({
        "title": browser.contentTitle,
        "url": browser.currentURI.spec,
        "isCurrentTab": tab === Tabs.getActiveTab(win)
      });
      console.log(browser.contentTitle);
    });
  });
  panel.port.emit('tabs-info', obj);
}

panel.port.on('tab-move', function(json){
  let browser, newtab;
  
  if(json.win != -1){
    browser = gWins[json.win].getBrowser();
    newtab = browser.addTab('about:blank');
    newtab.linkedBrowser.stop();
    browser.swapBrowsersAndCloseOther(newtab, gTabs[json.tab.w_idx][json.tab.t_idx]);
    listTabs();
  }
  else{
    /*
    newtab = Tabs.openTab(require('sdk/windows').browserWindows.open('about:blank'), 'about:blank');
    browser = newtab.getBrowserForTab();
    */
    gWins[json.tab.w_idx].getBrowser().replaceTabWithWindow(gTabs[json.tab.w_idx][json.tab.t_idx]);
    panel.hide();
  }
});

panel.port.on('tab-activate', function(json){
  Tabs.activateTab(gTabs[json.w_idx][json.t_idx], gWins[json.w_idx]);
  if(gWins[json.w_idx] === Windows.getMostRecentBrowserWindow()) listTabs();
  else{
    panel.hide();
    gWins[json.w_idx].focus();
  }
});

panel.port.on('resize-height', function(height){
  panel.height = height;
  //panel.resize(panel.width, height);
});
