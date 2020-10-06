import { Component } from "@angular/core";
import { Menus } from "./utils";

@Component({
  templateUrl: "./layout.component.html",
  selector: "app-layout",
  styleUrls: ["./layout.component.scss"],
})
export class LayoutComponent {
  collapse = false;
  menus = Menus;
}
