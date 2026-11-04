// FixMyFreedom — comportamiento de la página (sin dependencias)
(function () {
  // Cabecera con fondo al hacer scroll
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Menú en móvil
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var label = toggle.querySelector('.visually-hidden');
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // Formularios de demostración: validan, pero no envían nada
  var messages = {
    valueMissing: 'Rellena este campo.',
    typeMismatch: 'Escribe un correo electrónico válido, por ejemplo nombre@dominio.com.'
  };

  document.querySelectorAll('[data-demo-form]').forEach(function (form) {
    var status = form.querySelector('[data-status]');

    var clearError = function (field) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.remove('has-error');
      field.removeAttribute('aria-invalid');
      var err = wrap.querySelector('.field__error');
      if (err) err.remove();
    };

    var showError = function (field) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      clearError(field);
      var text = field.validity.valueMissing ? messages.valueMissing : messages.typeMismatch;
      var err = document.createElement('p');
      err.className = 'field__error';
      err.id = field.id + '-error';
      err.textContent = text;
      wrap.appendChild(err);
      wrap.classList.add('has-error');
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', err.id);
    };

    form.querySelectorAll('input, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.checkValidity()) clearError(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      form.querySelectorAll('input, textarea').forEach(function (field) {
        if (field.checkValidity()) {
          clearError(field);
        } else {
          showError(field);
          if (!firstInvalid) firstInvalid = field;
        }
      });
      if (firstInvalid) {
        if (status) status.textContent = '';
        firstInvalid.focus();
        return;
      }
      if (status) status.textContent = form.getAttribute('data-demo-message') ||
        'Este formulario es de ejemplo: el mensaje no se ha enviado.';
    });
  });

  // Enlaces de demostración (p. ej. recuperar contraseña)
  document.querySelectorAll('[data-demo-link]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var form = link.closest('form');
      var status = form && form.querySelector('[data-status]');
      if (status) status.textContent = 'La recuperación de contraseña todavía no está disponible en esta versión de demostración.';
    });
  });

  // Año actual en el pie
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
