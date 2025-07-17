import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-test',
  imports: [CommonModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {

  // test.component.ts
files = [
  {
    type: 'folder',
    name: 'Documents',
    files: [
      { type: 'file', name: 'Resume.pdf' },
      { type: 'file', name: 'CoverLetter.docx' }
    ]
  },
  {
    type: 'folder',
    name: 'Images',
    files: [
      { type: 'file', name: 'photo1.jpg' },
      { type: 'file', name: 'photo2.png' }
    ]
  },
  { type: 'file', name: 'ToDo.txt' }
];

copiedItems: any[] = [];


contextMenuVisible = false;
contextMenuX = 0;
contextMenuY = 0;
selectedItem: any;

onRightClick(event: MouseEvent, item: any) {
  event.preventDefault();
  this.contextMenuVisible = true;
  this.contextMenuX = event.clientX;
  this.contextMenuY = event.clientY;
  this.selectedItem = item;
}

copyItem() {
  if (this.selectedItem) {
    this.copiedItems = [JSON.parse(JSON.stringify(this.selectedItem))];
  }
  this.contextMenuVisible = false;
}

pasteItem() {
  if (this.copiedItems.length > 0) {
    const pasted = this.copiedItems.map(item => ({ ...item, name: item.name + ' - Copy' }));
    this.files.push(...pasted);
  }
  this.contextMenuVisible = false;
}

openFolder(item: any) {
  if (item.type === 'folder') {
    this.files = item.files; // navigate into folder
  }
}

@HostListener('document:click')
closeContextMenu() {
  this.contextMenuVisible = false;
}


}
