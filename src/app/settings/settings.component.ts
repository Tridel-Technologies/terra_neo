import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UnitService } from './unit.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GlobalConfig } from '../global/app.global';
import { BaseComponent } from '../base/base.component';

interface Folders {
  folder_id: number;
  folder_name: string;
  files: fileData[];
  timestamp: string;
}
// interface fileData {
//   file_id: number;
//   file_name: string;
//   is_processed: boolean;
//   water_level_unit: string;
//   current_speed_unit: string;
//   current_direction_unit: string;
//   battery_unit: string;
//   depth_unit: string;
//   coord_unit: string;
//   datetime_unit: string;
// }
interface fileData {
  file_id: number;
  file_name: string;
  is_processed: boolean;
  water_level_unit_to: string;
  current_speed_unit_to: string;
  current_direction_unit_to: string;
  battery_unit_to: string;
  depth_unit_to: string;
  coord_unit_to: string;
  datetime_unit: string;
  min_date: string;
  max_date: string;
}

@Component({
  selector: 'app-settings',
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  @Input() timezone!: string;
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  currentFile!: number;
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
    }, 100);
  }

  Foldertaped2(file: fileData[], folder: Folders) {
    this.openedFile2 = [];
    setTimeout(() => {
      this.openedFile2 = file;
      this.tappedFolder2 = folder;
    }, 100);
  }

  getFileClass(fine_name: string): string {
    return fine_name.endsWith('.csv')
      ? '../../assets/csv.png'
      : '../../assets/xl.png';
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
        .post(`${this.baseUrl}create_folder`, {
          folder_name: this.folderName,
        })
        .subscribe((response: any) => {
          console.log(response);
        });
    }
  }
  contextMenu = {
    visible: false,
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

    // Keep full file metadata so it isn't lost during move (e.g., min_date, max_date)
    this.fileToMove = {
      ...file,
      fromFolder: this.tappedFolder.folder_id,
    };
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
    if (this.fileToMove && targetFolder) {
      // Step 1: Remove the file from its original folder
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

    this.http
      .post(`${this.baseUrl}change_folder`, data)
      .subscribe((response: any) => {
        this.fileToMove = null;
        this.toastr.success('File moved', 'Success', {
          timeOut: 2000,
        });
        this.init();
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
          .post(`${this.baseUrl}create_folder`, {
            folder_name: folderName,
          })
          .subscribe((response: any) => {
            this.init();
          });
        this.toastr.success('Folder created', 'Success', {
          timeOut: 2000,
        });
      }
    }
  }

  setUnits(file: fileData) {
    this.selectedUnits = {
      waterLevel: file.water_level_unit_to,
      currentSpeed: file.current_speed_unit_to,
      currentDirection: file.current_direction_unit_to,
      battery: file.battery_unit_to,
      depth: file.depth_unit_to,
      latandlong: file.coord_unit_to,
      datetime:
        JSON.parse(localStorage.getItem('unitSettings') ?? '{}').datetime ||
        '01-Jan-2025 12:00:00',
    };

    this.currentFile = file.file_id;
    this.selectedFile = [file];
    this.selectedFiles = [{ file_name: file.file_name, file_id: file.file_id }];
  }

  unitSettings = [
    {
      key: 'waterLevel',
      label: 'Water Level',
      iconClass: 'fas fa-droplet', // or use another icon library
      units: ['m', 'ft', 'cm'],
      unitslabels: ['m', 'ft', 'cm'],
    },
    {
      key: 'currentSpeed',
      label: 'Current Speed',
      iconClass: 'fas fa-gauge',
      units: ['m/s', 'knots'],
      unitslabels: ['m/s', 'kn'],
    },
    {
      key: 'currentDirection',
      label: 'Current Direction',
      iconClass: 'fas fa-location-arrow',
      units: ['°', 'radians'],
      unitslabels: ['deg', 'rad'],
    },
    {
      key: 'battery',
      label: 'Battery',
      iconClass: 'fas fa-battery-half',
      units: ['%', 'volts'],
      unitslabels: ['per', 'volt'],
    },
    {
      key: 'depth',
      label: 'Depth',
      iconClass: 'fas fa-arrows-down-to-line',
      units: ['m', 'ft'],
      unitslabels: ['m', 'ft'],
    },
    {
      key: 'latandlong',
      label: 'Latitude and Longitude',
      iconClass: 'fas fa-map-marker-alt',
      units: ['dd', 'dms'],
      unitslabels: ['DD', 'DMS'],
    },
    {
      key: 'datetime',
      label: 'DateTime',
      iconClass: 'fas fa-clock',
      units: [
        '01-Jan-2025 12:00:00',
        '30-03-2025 12:00:00',
        '03-30-2025 12:00:00',
      ],
      unitslabels: [
        '01-Jan-2025 12:00:00',
        '30-03-2025 12:00:00',
        '03-30-2025 12:00:00',
      ],
    },
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
        m: 'Meter',
        ft: 'Feet',
        cm: 'Centimeter',
      },
      currentSpeed: {
        'm/s': 'Meter per second',
        knots: 'Knots',
      },
      currentDirection: {
        '°': 'Degree',
        radians: 'Radian',
      },
      battery: {
        '%': 'Percentage',
        volts: 'Volt',
      },
      depth: {
        m: 'Meter',
        ft: 'Feet',
      },
      latandlong: {
        dd: 'Decimal Degree',
        dms: 'Degree, Minute, Second',
      },
      datetime: {
        '01-Jan-2025 12:00:00': 'dd-M-yyyy',
        '30-03-2025 12:00:00': 'dd-mm-yyyy',
        '03-30-2025 12:00:00': 'mm-dd-yyyy',
      },
    };

    return tooltips[paramKey]?.[unit] || '';
  }

  selectedUnits: any = {};

  private baseUrl: string;

  constructor(
    private unitService: UnitService,
    private http: HttpClient,
    private toastr: ToastrService,
    private basee: BaseComponent
  ) {
    this.selectedUnits = this.unitService.getCurrentUnits();
    this.baseUrl = new GlobalConfig().baseUrl;
    // Set datetime from localStorage only
    const datetimeValue = JSON.parse(
      localStorage.getItem('unitSettings') ?? '{}'
    ).datetime;
    if (datetimeValue) {
      this.selectedUnits['datetime'] = datetimeValue;
    }
  }

  selectUnit(paramKey: string, unit: string) {
    if (paramKey === 'datetime') {
      // Only update localStorage for datetime
      this.selectedUnits[paramKey] = unit;
      const unitSettings = JSON.parse(
        localStorage.getItem('unitSettings') ?? '{}'
      );
      unitSettings['datetime'] = unit;
      localStorage.setItem('unitSettings', JSON.stringify(unitSettings));
      this.toastr.success('Datetime unit updated', 'Success', {
        timeOut: 1500,
      });
      return;
    }
    this.selectedUnits[paramKey] = unit;
    this.unitService.updateUnit(paramKey as any, unit);

    // Find the currently opened file (raw or processed)
    let currentFile = null;
    if (this.openedFile && this.openedFile.length > 0) {
      currentFile = this.openedFile[0];
    } else if (this.openedFile2 && this.openedFile2.length > 0) {
      currentFile = this.openedFile2[0];
    }

    if (currentFile && paramKey !== 'datetime') {
      const payload = {
        file_id: currentFile.file_id,
        unitKey: paramKey,
        unitValue: unit,
      };
      this.http.post(`${this.baseUrl}update_unit`, payload).subscribe({
        next: (res) => {
          this.toastr.success('Unit updated successfully', 'Success', {
            timeOut: 1500,
          });
        },
        error: (err) => {
          this.toastr.error('Failed to update unit', 'Error', {
            timeOut: 2000,
          });
        },
      });
    }
  }

  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }

  toggleFileSelection(fileName: string, event: MouseEvent, file_id: number) {
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
      this.http.get(`${this.baseUrl}allFiles`).subscribe((response: any) => {
        this.files_list = response['data'];
        console.log(this.files_list);
        this.non_processed = [];
        this.processedFiles = [];

        this.files_list.forEach((folder) => {
          const nonProcessedFiles = folder.files.filter(
            (file) => !file.is_processed
          );
          const processedFiles = folder.files.filter(
            (file) => file.is_processed
          );
          const emptyFolders = folder.files.length === 0;

          console.log('Empty:', emptyFolders);

          // If folder is empty → push directly
          if (emptyFolders) {
            this.non_processed.push({
              ...folder,
              files: [], // keep empty array
            });
            return; // skip rest
          }

          // If non-processed files exist
          if (nonProcessedFiles.length > 0) {
            this.non_processed.push({
              ...folder,
              files: nonProcessedFiles,
            });
          }

          // If processed files exist
          if (processedFiles.length > 0) {
            this.processedFiles.push({
              ...folder,
              files: processedFiles,
            });
          }
        });

        this.expandedFolders = this.files_list.map(() => false);
        this.openSelectedFile();
      });
    }, 100);
  }

  selectedFolder2!: Folders;
  selectedFile: fileData[] = [];
  openSelectedFile() {
    let selectedFileID = this.basee.fileId;

    if (!selectedFileID) {
      const fileObj = this.files_list
        .flatMap((g: any) => g.files)
        .find((f: any) => f.file_id);

      selectedFileID = fileObj?.file_id || null;
    }

    // Find the folder containing the file
    const folderContainingFile = this.files_list.find((folder) =>
      folder.files.some((file) => file.file_id === selectedFileID)
    );

    if (folderContainingFile) {
      // Set the folder to variable
      this.selectedFolder2 = folderContainingFile;

      // Find the file details
      const selectedFile = folderContainingFile.files.find(
        (file) => file.file_id === selectedFileID
      );

      if (selectedFile) {
        // Set the file to variable as an array (since your variable is fileData[])
        this.selectedFile = [selectedFile];

        if (selectedFile.is_processed) {
          this.Foldertaped2(this.selectedFile, this.selectedFolder2);
        } else {
          this.Foldertaped(this.selectedFile, this.selectedFolder2);
        }
        this.setUnits(selectedFile);
      }
    } else {
      this.toastr.error('File not found', 'Error', {
        timeOut: 2000,
      });
    }
  }

  exportHeader() {
    let currentFile: any = null;
    if (this.selectedFile && this.selectedFile.length > 0) {
      currentFile = this.selectedFile[0];
    } else if (this.openedFile && this.openedFile.length > 0) {
      currentFile = this.openedFile[0];
    } else if (this.openedFile2 && this.openedFile2.length > 0) {
      currentFile = this.openedFile2[0];
    } else if (this.selectedFiles && this.selectedFiles.length > 0) {
      const sel = this.selectedFiles[0];
      for (const folder of this.files_list) {
        const found = folder.files.find((f: any) => f.file_id === sel.file_id);
        if (found) {
          currentFile = found;
          break;
        }
      }
    }

    // Fallback: if dates are missing (e.g., after switching/moving), rehydrate from files_list by id
    if (
      currentFile &&
      (!currentFile.min_date || !currentFile.max_date) &&
      currentFile.file_id
    ) {
      for (const folder of this.files_list) {
        const found = folder.files.find(
          (f: any) => f.file_id === currentFile.file_id
        );
        if (found) {
          currentFile = found;
          break;
        }
      }
    }

    if (currentFile) {
      const first = `Deployment started date : ${currentFile.min_date}`;
      const last = `Deployment ended date : ${currentFile.max_date}`;
      const data = `
      Column1 = Station ID
      Column2 = Date/Time
      Column3 = Current Speed
      Column4 = Current Direction
      Column5 = Depth
      Column6 = Pressure (in bar)
      Column7 = Battery

      ${first}
      ${last}

      Selected file: ${currentFile.file_name}`;

      this.writeAndDownload(`${currentFile.file_name}_header.txt`, data);
    } else {
      this.toastr.error('No file selected', 'Error', {
        timeOut: 2000,
      });
    }
  }

  writeAndDownload(name: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
