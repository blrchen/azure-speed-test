import { Component, OnInit } from "@angular/core";
import { APIService } from "../../services";
import { IpInfo } from "src/app/models";
@Component({
  selector: "app-home",
  templateUrl: "./ipLookup.component.html",
  styleUrls: ["./ipLookup.component.scss"],
})
export class IPLookupComponent implements OnInit {
  message: string;
  result: IpInfo;
  ipAddressOrUrl: string;

  constructor(private apiService: APIService) {}

  ngOnInit() {
    this.result = {
      serviceTagId: "",
      ipAddress: "",
      ipAddressPrefix: "",
      region: "",
      systemService: "",
    };
  }

  onSubmit() {
    this.message = "Please wait ...";
    this.apiService.getIPInfo(this.ipAddressOrUrl).subscribe(
      (res) => {
        this.message = "";
        this.result = res;
      },
      () => {
        this.message = "Server error, please try again";
      }
    );
  }
}
