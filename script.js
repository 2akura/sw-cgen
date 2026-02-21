const state = {};
const mAccess = []; // array of {interface, ipv4}
const mTrunk = [];

const sections = {
  initdevicesetup: () => `
    <div class="form-container">
      <div class="content" style="display: flex; align-items: center; gap: 20px;">
        <label class="checkBox">
          <input type="checkbox" id="enable" ${state.enable ? "checked" : ""}/> 
          <div class="transition"></div>
          <span class="label-text"></span>
         </label>
         <label>enable</label>
      </div>
      ${["hostname","banner","password","username","domain_name"].map(id => `
        <div class="form-group">
          <label>${id} $ </label>
          <input id="${id}" type="text" placeholder=${id} value="${state[id] || ''}"/>
        </div>
      `).join('')}
    </div>
  `,
  int: () => `
    <div class="form-container">
      <div class="content" style="display: flex; align-items: center; gap: 20px;">
        <label class="checkBox">
          <input type="checkbox" id="configureterminal" ${state.configureterminal ? "checked" : ""}/> 
          <div class="transition"></div>
          <span class="label-text"></span>
         </label>
         <label>configure terminal</label>
      </div>
      <div id="macc-container"></div>
      <div class="note">Press this + button below to add more interfaces and ip's </div>
      <button type="button" id="addAccess"> [ + ] add_access mode port </button>
      <div id="mt-container"></div>
      <button type="button" id="addTrunk"> [ + ] add_trunk mode port </button>
    </div>
  `,
  notifications: () => `
    <div class="form-container">
      <div class="form-group">
        <label>Email</label>
        <input id="notifEmail" type="email" value="${state.notifEmail || ''}"/>
      </div>
    </div>
  `
};

const content = document.getElementById("config-content");
const sidebarItems = document.querySelectorAll(".sidebar li");
const glider = document.querySelector(".glider");


function renderSection(section) {
  content.innerHTML = sections[section]();

  // move glider to clicked section
  const index = Array.from(sidebarItems).findIndex(li => li.dataset.section === section);
  if(glider) glider.style.transform = `translateY(${index * 40}px)`; // adjust 40px to your li height

  // init inputs
  if(section === "initdevicesetup") {
    const cb = document.getElementById("enable");
    cb.addEventListener("change", e => state.enable = e.target.checked);
    ["hostname","banner","password","username","domain_name"].forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener("input", e => state[id] = e.target.value);
    });
  }

  if(section === "int") {
    const cb = document.getElementById("configureterminal");
    cb.addEventListener("change", e => state.configureterminal = e.target.checked);

    const accContainer = document.getElementById("macc-container");

    
    function renderAcc() {
  accContainer.innerHTML = "";

  if (mAccess.length === 0)
    mAccess.push({ type: "", interface: "", mdaccess: "", mdacc:"" });

  mAccess.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "interface-set";
    div.innerHTML = `
      <div class="form-group">
        <label>interface $ </label>
        <label>
          <input type="radio" name="access-ethernet-${idx}" value="fastethernet" ${item.type === "fastethernet" ? "checked" : ""}/>
          <span class="radio-text">fast_ethernet</span>
        </label> /
        <label>
          <input type="radio" name="access-ethernet-${idx}" value="gigabitethernet" ${item.type === "gigabitethernet" ? "checked" : ""}/>
          <span class="radio-text">gigabit_ethernet</span>
        </label>
        <input type="text" class="interface-input" data-idx="${idx}" value="${item.interface}" placeholder="interface"/>
      </div>

      <div class="form-group">
        <div class="content" style="display: flex; align-items: center; gap: 20px;">
          <label class="checkBox">
            <input type="checkbox" class="mode-access" data-idx="${idx}" ${item.mdaccess ? "checked" : ""}/> 
            <div class="transition"></div>
            <span class="label-text"></span>
          </label>
          <label>switchport mode access</label>
        </div>
      </div>

      <div class="form-group">
        <label>switchport access $ </label>
        <input type="text" class="mdaccess-input" data-idx="${idx}" value="${item.mdacc}" placeholder="e.g vlan 10"/>
      </div>
    `;
    accContainer.appendChild(div);
  });

  accContainer.addEventListener("change", e => {
    if (e.target.matches('input[type="radio"][name^="access-ethernet-"]')) {
      const div = e.target.closest(".interface-set");
      const idx = div.querySelector(".interface-input").dataset.idx;
      mAccess[idx].type = e.target.value;
    }
  });

  accContainer.addEventListener("input", e => {
    const idx = e.target.dataset.idx;
    if (e.target.classList.contains("interface-input"))
      mAccess[idx].interface = e.target.value;
    
    if (e.target.matches(".mode-access")) 
       mAccess[idx].mdaccess = e.target.checked;


    if (e.target.classList.contains("mdaccess-input"))
      mAccess[idx].mdacc = e.target.value;
  });
}

renderAcc();

document.getElementById("addAccess").addEventListener("click", () => {
  mAccess.push({ type: "", interface: "", mdaccess: "", mdacc:"" });
  renderInterfaces();
});

//////////////////////////////////////////////////////////////////////////////////////////

const trContainer = document.getElementById("mt-container");

function renderTr() {
  trContainer.innerHTML = "";

  if (mTrunk.length === 0)
    mTrunk.push({
      type: "",
      interface: "",
      encap: "",
      mdtr: "",
      trallowed: "",
      vlanrm: "",
      nativetr: ""
    });

  mTrunk.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "interface-set";
    div.innerHTML = `
      <div class="form-group">
        <label>interface $ </label>
        <label>
          <input type="radio" name="trunk-ethernet-${idx}" value="fastethernet" ${item.type === "fastethernet" ? "checked" : ""}/>
          <span class="radio-text">fast_ethernet</span>
        </label> /
        <label>
          <input type="radio" name="trunk-ethernet-${idx}" value="gigabitethernet" ${item.type === "gigabitethernet" ? "checked" : ""}/>
          <span class="radio-text">gigabit_ethernet</span>
        </label>
        <input type="text" class="interface-input" data-idx="${idx}" value="${item.interface}" placeholder="interface"/>
      </div>

      <div class="form-group">
        <div class="content" style="display: flex; align-items: center; gap: 20px;">
          <label class="checkBox">
            <input type="checkbox" class="encap-dot1q" data-idx="${idx}" ${item.encap ? "checked" : ""}/> 
            <div class="transition"></div>
            <span class="label-text"></span>
          </label>
          <label>switchport trunk encapsulation dot1q</label>
        </div>
      </div>

      <div class="form-group">
        <div class="content" style="display: flex; align-items: center; gap: 20px;">
          <label class="checkBox">
            <input type="checkbox" class="mode-trunk" data-idx="${idx}" ${item.mdtr ? "checked" : ""}/> 
            <div class="transition"></div>
            <span class="label-text"></span>
          </label>
          <label>switchport mode trunk</label>
        </div>
      </div>

      <div class="form-group">
        <label>switchport trunk allowed vlan add $ </label>
        <input type="text" class="trallowed-input" data-idx="${idx}" value="${item.trallowed}" placeholder="e.g 10, 20, 30 / 10"/>
        <div class="note"> to add vlan in bundle or individually</div>

        <label>switchport trunk allowed vlan remove $ </label>
        <input type="text" class="vlanrm-input" data-idx="${idx}" value="${item.vlanrm}" placeholder="e.g 10, 20, 30 / 10"/>
        <div class="note"> to remove vlan in bundle or individually </div>

        <label>switchport trunk native $ </label>
        <input type="text" class="nativetr-input" data-idx="${idx}" value="${item.nativetr}" placeholder="e.g vlan 10"/>
      </div>
    `;
    trContainer.appendChild(div);
  });

  trContainer.addEventListener("change", e => {
    if (e.target.matches('input[type="radio"][name^="trunk-ethernet-"]')) {
      const div = e.target.closest(".interface-set");
      const idx = div.querySelector(".interface-input").dataset.idx;
      mTrunk[idx].type = e.target.value;
    }
  });

  trContainer.addEventListener("input", e => {
    const idx = e.target.dataset.idx;

    if (e.target.classList.contains("interface-input"))
      mTrunk[idx].interface = e.target.value;
    if (e.target.matches(".encap-dot1q")) 
        mTrunk[idx].encap = e.target.checked;
    if (e.target.matches(".mode-trunk")) 
        mTrunk[idx].mdtr = e.target.checked;

    if (e.target.classList.contains("trallowed-input"))
      mTrunk[idx].trallowed = e.target.value;

    if (e.target.classList.contains("vlanrm-input"))
      mTrunk[idx].vlanrm = e.target.value;

    if (e.target.classList.contains("nativetr-input"))
      mTrunk[idx].nativetr = e.target.value;
  });
}

renderTr();

document.getElementById("addTrunk").addEventListener("click", () => {
  mTrunk.push({
    type: "",
    interface: "",
    encap: "",
    mdtr: "",
    trallowed: "",
    vlanrm: "",
    nativetr: ""
  });
  renderTr();
});
    
  }

  if(section === "notifications") {
    const input = document.getElementById("notifEmail");
    input.addEventListener("input", e => state.notifEmail = e.target.value);
  }
}

sidebarItems.forEach((li, index) => {
  li.addEventListener("click", () => {
    // render section
    renderSection(li.dataset.section);

    // update active for navbar
    sidebarItems.forEach(i => i.classList.remove("active"));
    li.classList.add("active");

    // move glider
    glider.style.transform = `translateY(${index * 100}%)`;
  });
});


// render first section on load
renderSection(sidebarItems[0].dataset.section);
sidebarItems[0].classList.add("active");

// Save button and modal 
document.getElementById("saveBtn").addEventListener("click", () => {
  const lines = [];

  if (state.enable) lines.push("enable");
  if(state.hostname) lines.push("hostname " + state.hostname);
  if(state.banner) lines.push("banner motd # " + state.banner + " #");
  if(state.password) lines.push("password " + state.password);
  if(state.username) lines.push("username " + state.username);
  if(state.domain_name) lines.push("domain name " + state.domain_name);
  if(state.configureterminal) lines.push("configure terminal");
mAccess.forEach(item => {
  if(item.interface) {
  let prefix = '';
  if(item.type === "fastethernet") prefix = "fastethernet ";
  else if(item.type === "gigabitethernet") prefix = "gigabitethernet ";
  lines.push(`interface ${prefix}${item.interface}`);
  if(item.mdaccess)lines.push(`switchport mode access`);
  if(item.mdacc) lines.push(`switchport access ${item.mdacc}`);
  }
});
mTrunk.forEach(item => {
  if(item.interface) {
  let prefix = '';
  if(item.type === "fastethernet") prefix = "fastethernet ";
  else if(item.type === "gigabitethernet") prefix = "gigabitethernet ";
  lines.push(`interface ${prefix}${item.interface}`);
  if(item.encap)lines.push(`switchport trunk encapsulation dot1q`);
  if(item.mdtr)lines.push(`switchport mode trunk`);
  if(item.trallowed) lines.push(`switchport trunk allowed vlan add ${item.trallowed}`);
  if(item.vlanrm) lines.push(`switchport trunk allowed vlan remove ${item.vlanrm}`);
  if(item.nativetr) lines.push(`switchport trunk native ${item.nativetr}`);
  }
});
  if(state.notifEmail) lines.push("notification email " + state.notifEmail);

  document.getElementById("configOutput").textContent = lines.join("\n");
  document.getElementById("resultModal").style.display = "flex";
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("resultModal").style.display = "none";
});
