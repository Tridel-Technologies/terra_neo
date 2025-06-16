import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UnitService } from './unit.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
interface Folders {
  folder_id: number;
  folder_name: string;
  files: fileData[];
  timestamp: string;
}
interface fileData {
  file_id: number;
  file_name: string;
  is_processed: boolean;
}
@Component({
  selector: 'app-settings',
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  selectedFiles: any[] = [];
  isMulti: boolean = false;
  files_list: Folders[] = [];
  non_processed: Folders[] = [];
  processedFiles: Folders[] = [];
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  isMoveMode = false;
  filesToMove: any[] = [];
  targetFolderId: number | null = null;
  openedFile: fileData[] = [];
  openedFile2: fileData[] = [];
  movingFile!: fileData;
  tappedFolder!: Folders;
  tappedFolder2!: Folders;
  Foldertaped(file: fileData[], folder: Folders) {
    this.openedFile = [];
    setTimeout(() => {
      this.openedFile = file;
      this.tappedFolder = folder;
      console.log(this.openedFile);
    }, 100);
  }

  Foldertaped2(file: fileData[], folder: Folders) {
    this.openedFile2 = [];
    setTimeout(() => {
      this.openedFile2 = file;
      this.tappedFolder2 = folder;
      console.log(this.openedFile);
    }, 100);
  }

  getFileClass(fine_name: string): string {
    return fine_name.endsWith('.csv') ? '../../assets/csv.png' : 'xl.png';
  }

  showCreate: boolean = false;
  clear() {
    //   contextMenu = {
    //   visible: false,
    //   x: 0,
    //   y: 0,
    //   type: 'blank', // 'file' | 'folder'
    //   folder: null
    // };
  }
  folderName!: string;
  onBlankAreaRightClick(event: MouseEvent) {
    event.preventDefault();
    this.showCreate = true;
    // const folderName = prompt("Enter new folder name:");
    if (this.folderName) {
      // this.files_list.push({ folder_name: folderName, files:  });
      this.http
        .post('http://192.168.0.111:3200/api/create_folder', {
          folder_name: this.folderName,
        })
        .subscribe((response: any) => {
          console.log(response);
        });
    }
  }
  contextMenu = {
    visible: true,
    x: 0,
    y: 0,
    type: 'blank', // 'file' | 'folder'
    folder: null,
  };

  fileToMove: any;
  onFileRightClick(event: MouseEvent, file: any) {
    event.preventDefault();
    event.stopPropagation();

    // Find the source folder
    const sourceFolder = this.files_list.find((folder) =>
      folder.files.some((f) => f.file_id === file.file_id)
    );

    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'file',
      folder: null,
    };

    this.fileToMove = {
      file_name: file.file_name,
      file_id: file.file_id,
      fromFolder: this.tappedFolder.folder_id,
    };
    console.log('filde', this.fileToMove);
    console.log('folder', this.tappedFolder);
  }

  onFolderRightClick(event: MouseEvent, folder: any) {
    event.preventDefault();
    event.stopPropagation(); // Stop bubbling to container
    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'folder',
      folder: folder,
    };
  }

  moveFile(file: fileData) {
    this.contextMenu.visible = false;
    this.movingFile = file;
    console.log('file', this.fileToMove);
    this.removeFileFromOriginalFolder(this.fileToMove);
  }

  removeFileFromOriginalFolder(fileToRemove: fileData) {
    for (let folder of this.files_list) {
      const index = folder.files.findIndex(
        (file) => file.file_id === fileToRemove.file_id
      );
      if (index !== -1) {
        folder.files.splice(index, 1);
        break;
      }
    }
    this.toastr.warning('Ready to move selected file', 'Ready', {
      timeOut: 2000,
    });
  }
  //{file_name: 'file2.csv', file_id: 12, fromFolder: 14}
  // {file_name: 'file2.csv', file_id: 12, fromFolder: 14}

  pasteFile(targetFolder: any) {
    console.log('paste', this.fileToMove, targetFolder);
    if (this.fileToMove && targetFolder) {
      // Step 1: Remove the file from its original folder
      console.log('start');
      const fromFolderIndex = this.files_list.findIndex(
        (f) => f.folder_id === this.fileToMove.fromFolder
      );
      if (fromFolderIndex !== -1) {
        const fileIndex = this.files_list[fromFolderIndex].files.findIndex(
          (f: any) => f.file_id === this.fileToMove.file_id
        );
        if (fileIndex !== -1) {
          this.files_list[fromFolderIndex].files.splice(fileIndex, 1);
        }
      }

      // Step 2: Add the file to the new folder
      const fileToInsert = { ...this.fileToMove }; // clone to avoid reference issues
      delete fileToInsert.fromFolder; // remove helper key if needed
      const toFolderIndex = this.files_list.findIndex(
        (f) => f.folder_id === targetFolder.folder_id
      );
      if (toFolderIndex !== -1) {
        this.files_list[toFolderIndex].files.push(fileToInsert);
      }

      // Step 3: Clear state and context menu

      this.changeFiles(targetFolder);
      this.contextMenu.visible = false;
    }
  }

  changeFiles(folder: any) {
    const data = {
      file_id: this.fileToMove.file_id,
      folder_id: folder.folder_id,
    };

    console.log(data);
    this.http
      .post('http://192.168.0.111:3200/api/change_folder', data)
      .subscribe((response: any) => {
        console.log(response);
        this.fileToMove = null;
        this.toastr.success('File moved', 'Success', {
          timeOut: 2000,
        });
      });
  }

  cancelContext() {
    this.contextMenu.visible = false;
    // this.fileToMove = null;
  }
  back() {
    this.openedFile = [];
  }
  back2() {
    this.openedFile2 = [];
  }

  onContainerRightClick(event: MouseEvent) {
    console.log('empty');
    event.preventDefault();
    // Only open folder context if clicked directly on container (not folder/file)
    if ((event.target as HTMLElement).classList.contains('fileCContainer')) {
      const folderName = prompt('Enter new folder name:');
      if (folderName) {
        // this.files_list.push({
        //   folder_name: folderName,
        //   files: []
        // });
        this.http
          .post('http://192.168.0.111:3200/api/create_folder', {
            folder_name: folderName,
          })
          .subscribe((response: any) => {
            console.log(response);
            this.init();
          });
      }
    }
  }

  unitSettings = [
    {
      key: 'waterLevel',
      label: 'Water Level',
      iconClass: 'fas fa-water', // or use another icon library
      units: ['m', 'ft', 'cm'],
    },
    {
      key: 'currentSpeed',
      label: 'Current Speed',
      iconClass: 'fas fa-tachometer-alt',
      units: ['m/s', 'knots'],
    },
    {
      key: 'currentDirection',
      label: 'Current Direction',
      iconClass: 'fas fa-compass',
      units: ['°'],
    },
    {
      key: 'battery',
      label: 'Battery',
      iconClass: 'fas fa-battery-full',
      units: ['%', 'volts'],
    },
    {
      key: 'depth',
      label: 'Depth',
      iconClass: 'fas fa-arrows-down-to-line',
      units: ['m', 'ft'],
    },
    // {
    //   key: 'latandlong',
    //   label: 'Latitude and Longitude',
    //   iconClass: 'fas fa-map-marker-alt',
    //   units: ['DD', 'DMS'],
    // },
  ];

  getFileImage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return '../../assets/csv.png'; // Path to CSV image
      case 'xlsx':
        return '../../assets/xl.png'; // Path to Excel image
      default:
        return 'assets/file.png'; // Default file image
    }
  }
  getTooltip(paramKey: string, unit: string): string {
    const tooltips: any = {
      waterLevel: {
        m: 'Meters',
        ft: 'Feet',
        cm: 'Centimeters',
      },
      currentSpeed: {
        'm/s': 'Meters per second',
        knots: 'Knots',
      },
      currentDirection: {
        '°': 'Degrees',
        rad: 'Radians',
      },
      battery: {
        '%': 'Percentage',
        volts: 'Volts',
      },
      depth: {
        m: 'Meters',
        ft: 'Feet',
      },
      latandlong: {
        DD: 'Decimal Degrees',
        DMS: 'Degrees, Minutes, Seconds',
      },
    };

    return tooltips[paramKey]?.[unit] || '';
  }

  selectedUnits: any = {};

  constructor(
    private unitService: UnitService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.selectedUnits = this.unitService.getCurrentUnits();
  }

  selectUnit(paramKey: string, unit: string) {
    this.selectedUnits[paramKey] = unit;
    this.unitService.updateUnit(paramKey as any, unit);
  }

  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
    console.log(this.expandedFolders);
  }

  toggleFileSelection(fileName: string, event: MouseEvent, file_id: number) {
    console.log(fileName, file_id);
    const isCtrlPressed = event.ctrlKey || event.metaKey; // Detect if Ctrl (Windows/Linux) or Cmd (Mac) is pressed

    if (isCtrlPressed) {
      this.isMulti = true;
      // If Ctrl/Cmd is pressed, toggle file selection
      const index = this.selectedFiles.indexOf(fileName);
      if (index === -1) {
        this.selectedFiles.push({
          file_name: fileName,
          file_id: file_id,
        }); // Add file to selection
        console.log(this.selectedFiles);
        // this.open_file(fileName, file_id)
      } else {
        this.selectedFiles.splice(index, 1); // Remove file from selection
      }
    } else {
      this.isMulti = false;
      // If Ctrl/Cmd is not pressed, select this file and deselect all others
      this.selectedFiles = [
        {
          file_name: fileName,
          file_id: file_id,
        },
      ]; // Only keep the clicked file selected
      // this.open_file(fileName, file_id)
    }
  }

  // Get the class for a selected file to highlight it
  // getFileClass(fileName: string): string {

  ngOnInit(): void {
    this.files_list = [];
    window.addEventListener('click', this.cancelContext.bind(this));
    this.init();
  }
  init() {
    this.files_list = [];
    setTimeout(() => {
      this.http
        .get('http://192.168.0.111:3200/api/files')
        .subscribe((response: any) => {
          this.files_list = response['data'];
          console.log('files:', response, this.files_list);
          const non_procces = this.files_list.filter((item) =>
            item.files.every((ite) => ite.is_processed === true)
          );
          console.log('non_proccessed', non_procces);
          this.non_processed = non_procces;
          const procces = this.files_list.filter((item) =>
            item.files.every((ite) => ite.is_processed === false)
          );
          this.processedFiles = procces;
          this.expandedFolders = this.files_list.map(() => false);
        });
    }, 100);
  }
}
