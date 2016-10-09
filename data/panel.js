function tab_dragstart(ev){
  let w_idx = this.getAttribute('data-w-idx');
  let t_idx = this.getAttribute('data-t-idx');

  ev.dataTransfer.setData('text/plain', w_idx + ':' + t_idx);
  ev.effectAllowed = 'move';
}

function tab_dblclick(ev){
  let w_idx = parseInt(this.getAttribute('data-w-idx'))
  let t_idx = parseInt(this.getAttribute('data-t-idx'))

  self.port.emit('tab-activate', {'w_idx': w_idx, 't_idx': t_idx});
}

function tab_drop(ev){
  let idxstr = ev.dataTransfer.getData('text/plain').split(':');
  let origin_w_idx = parseInt(idxstr[0]);
  let origin_t_idx = parseInt(idxstr[1]);
  let dest_w_idx = parseInt(this.getAttribute('data-w-idx'));
  let dest_t_idx = parseInt(this.getAttribute('data-t-idx'));

  if(dest_w_idx >= 0 && !this.hasAttribute('vpadding') && ev.offsetY > this.clientHeight / 2) dest_t_idx++;

  if(dest_w_idx == -2){
    self.port.emit('tab-close', {'w_idx': origin_w_idx, 't_idx': origin_t_idx});
  }
  else if(origin_w_idx != dest_w_idx || origin_t_idx != dest_t_idx){
    self.port.emit('tab-move', {
        'from': {'w_idx': origin_w_idx, 't_idx': origin_t_idx},
        'to': {'w_idx': dest_w_idx, 't_idx': dest_t_idx}});
  }
  ev.preventDefault();
}

function newwin_dblclick(ev){
  self.port.emit('new-window', 0);
}

function eventPreventDefault(ev){
  ev.preventDefault();
}

function draw(info){
  self.port.emit("resize-height", 1);
  let body = document.createElement('body');

  info.windows.forEach(function(w, w_idx){
    let w_el = document.createElement('div');
    w_el.setAttribute('class', 'win');
    w_el.setAttribute('data-is-active', w.isCurrentWindow);

    // Padding for top of window. It is a drop target.
    let pad = document.createElement('div');
    pad.setAttribute('data-w-idx', w_idx);
    pad.setAttribute('data-t-idx', 0);
    pad.setAttribute('class', 'vpadding');
    pad.addEventListener('dragover', eventPreventDefault);
    pad.addEventListener('drop', tab_drop);
    w_el.appendChild(pad);

    let movable = !w.isCurrentWindow || w.tabs.length > 1;
    w.tabs.forEach(function(tab, t_idx){
      let t_el = document.createElement('div');
      let title = tab.title || tab.url.replace(/^http:\/\//, "");

      t_el.setAttribute('data-w-idx', w_idx);
      t_el.setAttribute('data-t-idx', t_idx);
      t_el.setAttribute('class', 'tab');
      t_el.setAttribute('data-is-active', tab.isCurrentTab);

      t_el.setAttribute('draggable', true);
      t_el.addEventListener('dragstart', movable ? tab_dragstart : function(){return false;});
      t_el.addEventListener('dragover', eventPreventDefault);
      t_el.addEventListener('dblclick', tab_dblclick);
      t_el.addEventListener('drop', tab_drop);

      t_el.textContent = title;
      w_el.appendChild(t_el);
    });

    // Padding for bottom of window. It is a drop target.
    pad = document.createElement('div');
    pad.setAttribute('data-w-idx', w_idx);
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
  self.port.emit("resize-height", document.body.offsetHeight + 10);
}

self.port.on("tabs-info", draw);
self.port.on("panel-hide", function(){
  document.body = document.createElement('body');
});
