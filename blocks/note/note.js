/*
 * Note Block
 * One rich-text cell rendered as a note box with a type icon.
 * The type comes from the block option class; "information" is the default.
 * Add new types to NOTE_TYPES (and an icon rule in note.css).
 */

const NOTE_TYPES = {
  information: 'Information',
};
const DEFAULT_TYPE = 'information';

export default function decorate(block) {
  let type = Object.keys(NOTE_TYPES).find((t) => block.classList.contains(t));
  if (!type) {
    type = DEFAULT_TYPE;
    block.classList.add(type);
  }

  // all authored content (usually one row / one cell) becomes the text area
  const text = block.querySelector(':scope > div > div') || document.createElement('div');
  text.classList.add('note-text');

  const icon = document.createElement('span');
  icon.className = 'note-icon';
  icon.setAttribute('role', 'img');
  icon.setAttribute('aria-label', NOTE_TYPES[type]);

  const container = block.firstElementChild || document.createElement('div');
  container.className = 'note-body';
  // collect any extra cells/rows into the first text cell
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (cell !== text) text.append(...cell.childNodes);
  });
  [...block.children].forEach((row) => row !== container && row.remove());
  container.replaceChildren(icon, text);
  if (!container.parentElement) block.append(container);
}
