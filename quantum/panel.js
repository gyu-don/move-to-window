function tab_dragstart(ev){
  const w_id = this.getAttribute('data-w-id');
  const t_id = this.getAttribute('data-t-id');
  const t_idx = this.getAttribute('data-t-idx');

  ev.dataTransfer.setData('text/plain', w_id + ':' + t_id + ':' + t_idx);
  ev.effectAllowed = 'move';
}

function tab_dblclick(){
  const w_id = parseInt(this.getAttribute('data-w-id'))
  const t_id = parseInt(this.getAttribute('data-t-id'));

  if (t_id === undefined) return;
  browser.windows.update(w_id, { 'focused': true });
  browser.tabs.update(t_id, { 'active': true });
  draw();
}

function tab_drop(ev){
  const idstr = ev.dataTransfer.getData('text/plain').split(':');
  const origin_w_id = parseInt(idstr[0]);
  const origin_t_id = parseInt(idstr[1]);
  const origin_t_idx = parseInt(idstr[2]);
  const dest_w_id = parseInt(this.getAttribute('data-w-id'));
  const dest_w_idx = parseInt(this.getAttribute('data-w-idx'));
  const dest_t_id = parseInt(this.getAttribute('data-t-id'));
  let dest_t_idx = parseInt(this.getAttribute('data-t-idx'));

  if(origin_t_id === undefined) return;
  if(dest_w_idx >= 0 && !this.hasAttribute('vpadding') && ev.offsetY > this.clientHeight / 2) dest_t_idx++;
  if(origin_w_id === dest_w_id && origin_t_idx < dest_t_idx) dest_t_idx--;

  if(dest_w_idx == -1){
    browser.windows.create({ 'tabId': origin_t_id }).then(draw);
  }
  if(dest_w_idx == -2){
    browser.tabs.remove(origin_t_id).then(draw);
  }
  else if(origin_t_id != dest_t_id){
    browser.windows.get(dest_w_id, { 'populate': true }).then((w) => {
      const n_pinned = w.tabs.map((t) => { return t.pinned ? 1 : 0 }).reduce((x, acc) => { return acc + x });
      console.log(n_pinned);
      if(dest_t_idx < n_pinned) dest_t_idx = n_pinned;
      browser.tabs.move(origin_t_id, { 'windowId': dest_w_id, 'index': dest_t_idx }).then(draw);
    });
  }
  ev.preventDefault();
}

function newwin_dblclick(ev){
  browser.windows.create().then(draw);
}

function eventPreventDefault(ev){
  ev.preventDefault();
}

function draw_tabs(info){
  let body = document.createElement('body');

  info.windows.forEach(function(w, w_idx){
    let w_el = document.createElement('div');
    w_el.setAttribute('class', 'win');
    w_el.setAttribute('data-is-active', w.isCurrentWindow);

    // Padding for top of window. It is a drop target.
    let pad = document.createElement('div');
    pad.setAttribute('data-w-idx', w_idx);
    pad.setAttribute('data-w-id', w.id);
    pad.setAttribute('data-t-idx', 0);
    pad.setAttribute('class', 'vpadding');
    pad.addEventListener('dragover', eventPreventDefault);
    pad.addEventListener('drop', tab_drop);
    w_el.appendChild(pad);

    w.tabs.forEach(function(tab, t_idx){
      //console.log(tab);
      let t_el = document.createElement('div');
      let title = tab.title || tab.url.replace(/^https?:\/\/(www.)?/, "");

      t_el.setAttribute('data-w-idx', w_idx);
      t_el.setAttribute('data-w-id', w.id);
      t_el.setAttribute('data-t-idx', t_idx);
      t_el.setAttribute('data-t-id', tab.id);
      t_el.setAttribute('class', 'tab');
      t_el.setAttribute('data-is-active', tab.isCurrentTab);

      t_el.setAttribute('draggable', true);
      t_el.addEventListener('dragstart', tab_dragstart);
      t_el.addEventListener('dragover', eventPreventDefault);
      t_el.addEventListener('dblclick', tab_dblclick);
      t_el.addEventListener('drop', tab_drop);

      t_el.textContent = title;
      w_el.appendChild(t_el);
    });

    // Padding for bottom of window. It is a drop target.
    pad = document.createElement('div');
    pad.setAttribute('data-w-idx', w_idx);
    pad.setAttribute('data-w-id', w.id);
    pad.setAttribute('data-t-idx', w.tabs.length);
    pad.setAttribute('class', 'vpadding');
    pad.addEventListener('dragover', eventPreventDefault);
    pad.addEventListener('drop', tab_drop);
    w_el.appendChild(pad);

    body.appendChild(w_el);
  });

  let w_el = document.createElement('div');
  w_el.setAttribute('class', 'container');

  let div = document.createElement('div');
  div.setAttribute('data-w-idx', -1);
  div.setAttribute('class', 'win new_win');
  div.addEventListener('dragover', eventPreventDefault);
  div.addEventListener('drop', tab_drop);
  div.addEventListener('dblclick', newwin_dblclick);
  div.textContent = 'New window';
  w_el.appendChild(div);

  div = document.createElement('div');
  div.setAttribute('data-w-idx', -2);
  div.setAttribute('class', 'win close_tab');
  div.addEventListener('dragover', eventPreventDefault);
  div.addEventListener('drop', tab_drop);
  div.textContent = 'Close tab';
  w_el.appendChild(div);

  body.appendChild(w_el);

  document.body = body;
}

function draw() {
  fetch().then(draw_tabs);
}

function fetch() {
  //console.log('fetch');
  return browser.windows.getAll({ 'populate': true }).then((ws) => {
    let fetched = {};
    fetched.windows = [];
    for(w of ws) {
      let wobj = {};
      wobj.isCurrentWindow = w.focused;
      wobj.id = w.id;
      wobj.tabs = w.tabs.map((tab) => {
        let tobj = {};
        tobj.isCurrentTab = tab.active;
        tobj.url = tab.url;
        tobj.title = tab.title;
        tobj.id = tab.id;
        return tobj;
      });
      fetched.windows.push(wobj);
    }
    return fetched;
  });
}

document.addEventListener('DOMContentLoaded', () => { draw(); });
