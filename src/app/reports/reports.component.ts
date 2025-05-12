import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';

interface Column {
  field: string;
  header: string;
  type: string;
  customExportHeader?: string;
}
@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    MultiSelectModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  sampleDataAdcp = [
    {
      id: 1,
      timestamp: '2024-10-01T00:00:00Z',
      current_speed: 1.2,
      current_direction: 30,
      tide: 0.71,
    },
    {
      id: 2,
      timestamp: '2024-10-01T01:00:00Z',
      current_speed: 1.5,
      current_direction: 45,
      tide: 1.06,
    },
    {
      id: 3,
      timestamp: '2024-10-01T02:00:00Z',
      current_speed: 0.8,
      current_direction: 60,
      tide: 1.44,
    },
    {
      id: 4,
      timestamp: '2024-10-01T03:00:00Z',
      current_speed: 2.1,
      current_direction: 90,
      tide: 0.79,
    },
    {
      id: 5,
      timestamp: '2024-10-01T04:00:00Z',
      current_speed: 1.9,
      current_direction: 120,
      tide: 0.9,
    },
    {
      id: 6,
      timestamp: '2024-10-01T05:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
      tide: 1.66,
    },
    {
      id: 7,
      timestamp: '2024-10-01T06:00:00Z',
      current_speed: 0.5,
      current_direction: 180,
      tide: 0.5,
    },
    {
      id: 8,
      timestamp: '2024-10-01T07:00:00Z',
      current_speed: 1.3,
      current_direction: 210,
      tide: 0.79,
    },
    {
      id: 9,
      timestamp: '2024-10-01T08:00:00Z',
      current_speed: 1.4,
      current_direction: 240,
      tide: 0.86,
    },
    {
      id: 10,
      timestamp: '2024-10-01T09:00:00Z',
      current_speed: 0.9,
      current_direction: 270,
      tide: 1.13,
    },
    {
      id: 11,
      timestamp: '2024-10-01T10:00:00Z',
      current_speed: 1.1,
      current_direction: 300,
      tide: 1.02,
    },
    {
      id: 12,
      timestamp: '2024-10-01T11:00:00Z',
      current_speed: 1.0,
      current_direction: 330,
      tide: 0.94,
    },
    {
      id: 13,
      timestamp: '2024-10-01T12:00:00Z',
      current_speed: 1.4,
      current_direction: 360,
      tide: 0.86,
    },
    {
      id: 14,
      timestamp: '2024-10-01T13:00:00Z',
      current_speed: 2.0,
      current_direction: 15,
      tide: 1.29,
    },
    {
      id: 15,
      timestamp: '2024-10-01T14:00:00Z',
      current_speed: 1.7,
      current_direction: 30,
      tide: 0.91,
    },
    {
      id: 16,
      timestamp: '2024-10-01T15:00:00Z',
      current_speed: 1.8,
      current_direction: 45,
      tide: 0.72,
    },
    {
      id: 17,
      timestamp: '2024-10-01T16:00:00Z',
      current_speed: 1.2,
      current_direction: 60,
      tide: 1.29,
    },
    {
      id: 18,
      timestamp: '2024-10-01T17:00:00Z',
      current_speed: 0.7,
      current_direction: 90,
      tide: 1.61,
    },
    {
      id: 19,
      timestamp: '2024-10-01T18:00:00Z',
      current_speed: 1.4,
      current_direction: 120,
      tide: 0.79,
    },
    {
      id: 20,
      timestamp: '2024-10-01T19:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
      tide: 1.05,
    },
  ];

  cols!: Column[];
  selectedColumns!: Column[];
  globalFilterFields!: string[];
  searchQuery: string = '';

  ngOnInit(): void {
    this.cols = [
      // { field: 'id', header: 'ID', type: 'text' },
      { field: 'timestamp', header: 'Time Stamp', type: 'shortDate' },
      { field: 'tide', header: 'Tide', type: 'text' },
      { field: 'current_speed', header: 'Current Speed', type: 'text' },
      { field: 'current_direction', header: 'Current Direction', type: 'text' },
    ];
    this.selectedColumns = this.cols;
    this.globalFilterFields = this.cols.map((col) => col.field);
  }

  onSearch(query: string, dt: any): void {
    this.searchQuery = query;
    dt.filterGlobal(query, 'contains');
  }

  highlightSearchText(value: any): string {
    if (!this.searchQuery) return value;

    // Ensure the value is treated as a string
    const stringValue =
      value !== null && value !== undefined ? String(value) : '';
    const escapedSearchQuery = this.searchQuery.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );
    const regex = new RegExp(`(${escapedSearchQuery})`, 'gi');
    return stringValue.replace(regex, '<span class="highlight">$1</span>');
  }

  rowMatchesSearch(rowData: any, columns: any[]): boolean {
    if (!this.searchQuery) return false;

    const search = this.searchQuery.toLowerCase();

    return columns.some((col) => {
      const value = rowData[col.field];
      return (
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(search)
      );
    });
  }
}
