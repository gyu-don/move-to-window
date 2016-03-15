/*document.body.addEventListener("DOMContentLoaded", function(){ 
});
*/

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

function win_drop(ev){
  let idxstr = ev.dataTransfer.getData('text/plain').split(':');
  let origin_w_idx = parseInt(idxstr[0]);
  let origin_t_idx = parseInt(idxstr[1]);
  let dest_w_idx = parseInt(this.getAttribute('data-w-idx'));

  if(origin_w_idx != dest_w_idx){
    self.port.emit('tab-move', {'tab': {'w_idx': origin_w_idx, 't_idx': origin_t_idx}, 'win': dest_w_idx});
  }
  ev.preventDefault();
}

function draw(info){
  document.body.innerHTML = '';

  let fragment = document.createDocumentFragment();

  info.windows.forEach(function(w, w_idx){
    let w_el = document.createElement('div');

    w_el.setAttribute('data-w-idx', w_idx);
    w_el.setAttribute('class', w.isCurrentWindow ? 'win current_win' : 'win');
    w_el.setAttribute('ondragover', 'return event.preventDefault()');
    w_el.addEventListener('drop', win_drop);

    let movable = !w.isCurrentWindow || w.tabs.length > 1;
    w.tabs.forEach(function(tab, t_idx){
      let t_el = document.createElement('div');
      let lbl_el = document.createElement('label');
      let check = document.createElement('input');

      t_el.setAttribute('data-w-idx', w_idx);
      t_el.setAttribute('data-t-idx', t_idx);
      t_el.setAttribute('class', tab.isCurrentTab ? 'tab current_tab' : 'tab');

      t_el.setAttribute('draggable', true);
      t_el.addEventListener('dragstart', movable ? tab_dragstart : function(){return false;});
      t_el.addEventListener('dblclick', tab_dblclick);

      t_el.textContent = tab.title;
      w_el.appendChild(t_el);
    });

    fragment.appendChild(w_el);
  }); 

  let w_el = document.createElement('div');

  w_el.setAttribute('data-w-idx', -1);
  w_el.setAttribute('class', 'win new_win');
  w_el.setAttribute('ondragover', 'return event.preventDefault()');
  w_el.addEventListener('drop', win_drop);
  w_el.textContent = 'New window';
  fragment.appendChild(w_el);

  document.body.appendChild(fragment);
  self.port.emit("resize-height", document.body.scrollHeight);
}

self.port.on("tabs-info", draw);
self.port.on("panel-hide", function(){
  document.body.innerHTML = '';
});
