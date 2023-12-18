import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AnalyticsService } from './analytics.service';

import { ToastrService } from 'ngx-toastr';

import { DasboardService } from 'src/app/components/dashboard/dashboard.service';
declare var window: any;

@Component({
  selector: 'ow-analytics-tab',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  uid = '' as any;
  bradcrumb = '' as any;
  currentTab = 'heatmap';
  currentRoute: any = '';
  isCollapsed = false;
  getrequestObj:any;
  UnderlyingPrice: string;
  BundlePrice: string;
  AtmIV: string;
  DivYield: string;
  RiskFreeRate: string;
  resultdata:{};
  formModal: any;

  constructor(
    private dashboardService: DasboardService,
    private router: Router,
    private auth: AngularFireAuth,
    private modalService: NgbModal,
    private toast: ToastrService,
    private analyticsService: AnalyticsService,

  ) {

    this.currentRoute = this.router.url;
    this.getrequestObj = {
      strategy: "IronCondor",
      Underlying: "AAPL",
      OptionContracts:  "Iron Condor 2023-07-15 40|45|55|60",
    
    };
    this.resultdata={};
    
    this.UnderlyingPrice="";
    this.BundlePrice="";
    this.AtmIV="";
    this.DivYield="";
    this.RiskFreeRate="";
  
    this.bradcrumb = {
      title: 'Analytic',
      subtitle: '',
      data: [
        {
          name: 'Home',
          navigation: '/dashboard',
        },
        {
          name: 'Analytic',
          navigation: false,
        }
      ]
    }
  }

  setTab(tabName: string){
    this.currentTab = tabName;
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
    // if (this.isCollapsed) {
    //   $('.SideBarMain').removeClass('active');
    //   $('.SideBarLft').removeClass('Addwidth');
    // } else {
    //   $('.SideBarMain').addClass('active');
    //   $('.SideBarLft').addClass('Addwidth');
    // }
  }

  ngOnInit(): void {
    this.analyticsService.GetMetricsForAnalyzeModelValuation(this.getrequestObj).subscribe(result => {
      console.log(result,"response123456789");
      const resultdata={
        GetUnderlyingPrice:"$135.05",
        GetBundlePrice:"$135.05",
        GetAtmIV:"17%",
        GetDivYield:"5%",
        GetRiskFreeRate:"5%",
      }
      // console.log(this.resultdata.UnderlyingPrice123)
      this.UnderlyingPrice=resultdata.GetUnderlyingPrice;
      this.BundlePrice=resultdata.GetBundlePrice;
      this.AtmIV=resultdata.GetAtmIV;
      this.DivYield=resultdata.GetDivYield;
      this.RiskFreeRate=resultdata.GetRiskFreeRate;
     
   });
   this.formModal = new window.bootstrap.Modal(
    document.getElementById('myModalAnalytics')
  );
  this.formModal.show();
  }

}