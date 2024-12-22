import { Component, OnInit } from '@angular/core'
import { RegionService } from './services'
import { DefaultRegionsKey } from './models'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private regionService: RegionService) {}

  ngOnInit() {
    const regions = localStorage.getItem(DefaultRegionsKey)
    this.regionService.updateSelectedRegions(regions ? JSON.parse(regions) : [])
  }
}
