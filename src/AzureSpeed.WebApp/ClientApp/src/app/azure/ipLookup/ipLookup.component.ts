import { Component, OnInit } from "@angular/core";
import { IpInfo } from "src/app/models";
import { APIService } from "../../services";
@Component({
  selector: "app-ip-lookup",
  templateUrl: "./ipLookup.component.html",
  styleUrls: ["./ipLookup.component.scss"],
})
export class IPLookupComponent implements OnInit {
  message: string;
  tableData: IpInfo[];
  ipAddressOrUrl: string;

  constructor(private apiService: APIService) {}

  ngOnInit() {
    this.tableData = [];
  }

  onSubmit() {
    this.message = "Please wait ...";
    this.apiService.getIpInfo(this.ipAddressOrUrl).subscribe(
      (res) => {
        this.message = "";
        this.tableData = res;
      },
      () => {
        this.message = "Server error, please try again";
      }
    );
  }
}
