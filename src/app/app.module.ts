import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { PreviewComponent } from "./preview/preview.component";
import { HttpClientModule } from "@angular/common/http";
import { PreviewControlDirective } from "./preview-control.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { TutorialComponent } from "./tutorial/tutorial.component";

@NgModule({
	declarations: [
		AppComponent,
		PreviewComponent,
		PreviewControlDirective,
		TutorialComponent,
	],
	imports: [BrowserModule, HttpClientModule, FontAwesomeModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
