/**
* Template Name: NiceAdmin
* Template URL: https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/
* Updated: Apr 20 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    if (all) {
      select(el, all).forEach(e => e.addEventListener(type, listener))
    } else {
      select(el, all).addEventListener(type, listener)
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Sidebar toggle
   */
  if (select('.toggle-sidebar-btn')) {
    on('click', '.toggle-sidebar-btn', function (e) {
      select('body').classList.toggle('toggle-sidebar')
    })
  }

  /**
   * Search bar toggle
   */
  if (select('.search-bar-toggle')) {
    on('click', '.search-bar-toggle', function (e) {
      select('.search-bar').classList.toggle('search-bar-show')
    })
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Initiate tooltips
   */
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })

  /**
   * Initiate quill editors
   */
  if (select('.quill-editor-default')) {
    new Quill('.quill-editor-default', {
      theme: 'snow'
    });
  }

  if (select('.quill-editor-bubble')) {
    new Quill('.quill-editor-bubble', {
      theme: 'bubble'
    });
  }

  if (select('.quill-editor-full')) {
    new Quill(".quill-editor-full", {
      modules: {
        toolbar: [
          [{
            font: []
          }, {
            size: []
          }],
          ["bold", "italic", "underline", "strike"],
          [{
            color: []
          },
          {
            background: []
          }
          ],
          [{
            script: "super"
          },
          {
            script: "sub"
          }
          ],
          [{
            list: "ordered"
          },
          {
            list: "bullet"
          },
          {
            indent: "-1"
          },
          {
            indent: "+1"
          }
          ],
          ["direction", {
            align: []
          }],
          ["link", "image", "video"],
          ["clean"]
        ]
      },
      theme: "snow"
    });
  }

  /**
   * Initiate TinyMCE Editor
   */

  const useDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 1023.5px)').matches;

  tinymce.init({
    selector: 'textarea.tinymce-editor',
    plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion',
    editimage_cors_hosts: ['picsum.photos'],
    menubar: 'file edit view insert format tools table help',
    toolbar: "undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl",
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: '{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
    image_advtab: true,
    link_list: [{
      title: 'My page 1',
      value: 'https://www.tiny.cloud'
    },
    {
      title: 'My page 2',
      value: 'http://www.moxiecode.com'
    }
    ],
    image_list: [{
      title: 'My page 1',
      value: 'https://www.tiny.cloud'
    },
    {
      title: 'My page 2',
      value: 'http://www.moxiecode.com'
    }
    ],
    image_class_list: [{
      title: 'None',
      value: ''
    },
    {
      title: 'Some class',
      value: 'class-name'
    }
    ],
    importcss_append: true,
    file_picker_callback: (callback, value, meta) => {
      /* Provide file and text for the link dialog */
      if (meta.filetype === 'file') {
        callback('https://www.google.com/logos/google.jpg', {
          text: 'My text'
        });
      }

    },
    height: 600,
    image_caption: true,
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    noneditable_class: 'mceNonEditable',
    toolbar_mode: 'sliding',
    contextmenu: 'link image table',
    skin: useDarkMode ? 'oxide-dark' : 'oxide',
    content_css: useDarkMode ? 'dark' : 'default',
    content_style: 'body { font-family:Helvetica,Montserrat,sans-serif; font-size:14px }'
  });


  /**
   * Initiate Datatables
   */
  const datatables = select('.datatable', true)
  datatables.forEach(datatable => {
    new simpleDatatables.DataTable(datatable, {
      perPageSelect: [5, 10, 15, ["All", -1]],
      columns: [{
        select: 2,
        sortSequence: ["desc", "asc"]
      },
      {
        select: 3,
        sortSequence: ["desc"]
      },
      {
        select: 4,
        cellClass: "green",
        headerClass: "red"
      }
      ]
    });
  })

  /**
   * Autoresize echart charts
   */
  const mainContainer = select('#main');
  if (mainContainer) {
    setTimeout(() => {
      new ResizeObserver(function () {
        select('.echart', true).forEach(getEchart => {
          echarts.getInstanceByDom(getEchart).resize();
        })
      }).observe(mainContainer);
    }, 200);
  }

})();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const loginSpinner = loginButton.querySelector('.spinner-border');
  const loginText = loginButton.querySelector('.btn-text');

  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
  const forgotSpinner = forgotSubmitBtn.querySelector('.spinner-border');
  const forgotText = forgotSubmitBtn.querySelector('.btn-text');
  const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
  const feedbackMessage = document.getElementById('feedbackMessage');

  // Helper: show feedback
  function showFeedback(message, isSuccess = true) {
    feedbackMessage.textContent = message;
    feedbackMessage.style.color = isSuccess ? '#00ffb3' : '#ff6b6b';
    feedbackModal.show();
    setTimeout(() => feedbackModal.hide(), 2500);
  }

  // Helper: toggle spinner state
  function toggleButtonLoading(button, spinner, textSpan, isLoading, textWhenDone) {
    if (isLoading) {
      button.disabled = true;
      spinner.classList.remove('d-none');
      textSpan.textContent = 'Please wait...';
    } else {
      button.disabled = false;
      spinner.classList.add('d-none');
      textSpan.textContent = textWhenDone;
    }
  }

  // 🔹 Login Handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentID = document.getElementById('studentID').value.trim();
    const password = document.getElementById('yourPassword').value.trim();
    const remember = document.getElementById('rememberMe').checked; // ✅ Get checkbox state

    if (!studentID || !password) {
      showFeedback('⚠️ Please fill in all fields.', false);
      return;
    }

    try {
      toggleButtonLoading(loginButton, loginSpinner, loginText, true);

      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentID, password })
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Save user data
        if (data.userRole === 'student' && data.student) {
          localStorage.setItem('studentData', JSON.stringify(data.student));
        } else if (data.userRole === 'faculty' && data.faculty) {
          localStorage.setItem('facultyData', JSON.stringify(data.faculty));
        }

        // ✅ Handle "Remember Me"
        if (remember) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedID', studentID);
          localStorage.setItem('rememberedPass', password)
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedID');
          localStorage.removeItem('rememberedPass', password)
        }

        window.location.href = data.redirect;
      } else {
        showFeedback(data.message, false);
      }
    } catch (err) {
      console.error('Login error:', err);
      showFeedback('❌ Error connecting to server.', false);
    } finally {
      toggleButtonLoading(loginButton, loginSpinner, loginText, false, 'Login');
    }
  });

  // 🔹 Forgot Password Handler
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();
    if (!email) {
      showFeedback('⚠️ Please enter your email.', false);
      return;
    }

    try {
      toggleButtonLoading(forgotSubmitBtn, forgotSpinner, forgotText, true);

      const res = await fetch('/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        showFeedback('✅ A new password has been sent to your email.');
        forgotPasswordForm.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
        modal.hide();
      } else {
        showFeedback(data.message || '❌ Unable to process request.', false);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      showFeedback('❌ Error connecting to server.', false);
    } finally {
      toggleButtonLoading(forgotSubmitBtn, forgotSpinner, forgotText, false, 'Send New Password');
    }
  });
});

// 🔹 Autofill remembered student ID
document.addEventListener('DOMContentLoaded', () => {
  const remembered = localStorage.getItem('rememberMe');
  const rememberedID = localStorage.getItem('rememberedID');
  const rememberedPass = localStorage.getItem('rememberedPass');

  if (remembered && rememberedID) {
    document.getElementById('studentID').value = rememberedID;
    document.getElementById('yourPassword').value = rememberedPass;
    document.getElementById('rememberMe').checked = true;
  }
});

