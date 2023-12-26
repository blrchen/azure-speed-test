import { Component, OnInit } from '@angular/core'
import { Region } from 'src/app/models'
import data from '../../../assets/data/regions.json'

@Component({
  selector: 'app-azure-region',
  templateUrl: './azureRegions.component.html'
})
export class AzureRegionsComponent implements OnInit {
  tableData: Region[] = []

  ngOnInit() {
    this.tableData = data.sort((a, b) => a.geography.localeCompare(b.geography))
  }
}
