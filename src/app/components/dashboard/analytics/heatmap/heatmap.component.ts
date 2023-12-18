import { Component, OnInit, Input,ViewEncapsulation } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { UtilityService } from 'src/app/_service/utility.service';
import { OptionsParameter } from 'src/app/interface/options-parameter';
import { Options,  } from '@angular-slider/ngx-slider';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AnalyticsService } from '../analytics.service';

import * as moment from 'moment';
import * as $ from 'jquery';
declare var window: any;
@Component({
  selector: 'ow-analytic-heatmap-tab',
  templateUrl: './heatmap.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./heatmap.component.css']
})


export class HeatMapComponent implements OnInit {
  
  HeatmapData: number[][];
  HeatmapColHeaders: number[];
  HeatmapRowHeaders: number[];
  AppliedUnitType: string;
  ModalNumber: number;
  formModal: any;
  StrategyList: OptionsStrategy[];
  OptionParameterList: OptionsParameter[];
  ConfigForm: FormGroup;
  getrequestObj:any;
  updaterequestObj:any;
  
  LegDistanceNewOptions: Options = {
    floor: 2.5,
    ceil: 25,
    step: 0.1,
    minLimit: 2.5,
    maxLimit: 25,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  LegDistanceFurtherOptions: Options = {
    floor: 2.5,
    ceil: 25,
    step: 0.1,
    minLimit: 2.5,
    maxLimit: 25,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  TimeToExpiryOptions: Options = {
    floor: 15,
    ceil: 90,
    step: 15,
    minLimit: 15,
    maxLimit: 90,
    showSelectionBar: true
  };
  RiskFreeRateOptions: Options = {
    floor: 0,
    ceil: 100,
    step: 2,
    minLimit: 0,
    maxLimit: 100,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  DividendYieldOptions: Options = {
    floor: 0,
    ceil: 100,
    step: 2,
    minLimit: 0,
    maxLimit: 100,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  IVValueOptions: Options = {
    floor: 0,
    ceil: 100,
    step: 5,
    minLimit: 15,
    maxLimit: 90,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  IVSkewRateOptions: Options = {
    floor: 0,
    ceil: 2,
    step: 0.05,
    minLimit: 0,
    maxLimit: 2,
    showSelectionBar: true
  };
  
  @Input() isCollapsed!: any;

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private formBuilder: FormBuilder,
    private utilityService: UtilityService,
    private modalService: NgbModal,
    private analyticsService: AnalyticsService,

  ) {
    
    var defaultTimeToExpiry = 15;
    this.AppliedUnitType = "Standard";
    this.ModalNumber=0;
     this.getrequestObj = {
      strategy: "IronCondor",
      Underlying: "AAPL",
      OptionContracts:  "Iron Condor 2023-07-15 40|45|55|60",
    
    };
    this.analyticsService.GetMetricsForAnalyzeModelValuation(this.getrequestObj).subscribe(result => {
       console.log(result,"response123")
    });
    this.HeatmapColHeaders = [...Array(defaultTimeToExpiry).keys()].map(i => i + 1);
    this.HeatmapRowHeaders = [...Array(50).keys()].map(i => i + 160);
    this.HeatmapData = Array(50);
    for (var i = 0; i < 50; i++) {
      this.HeatmapData[i] = [];
      for (var j = 0; j < defaultTimeToExpiry; j++) {
        this.HeatmapData[i][j] = (Math.floor(Math.random() * 2000 - 1000));
      }
    }
    
    this.StrategyList = utilityService.getStrategySelections();
    this.OptionParameterList = this.utilityService.getOptionParameters(this.StrategyList[0].Name);
    this.ConfigForm = this.formBuilder.group(
      {
        SelectedStrategy: [this.StrategyList[0]],
        SelectedStock: [{}],
        SelectedExpiry: [""],
        SelectedParameter: [this.OptionParameterList[0]],
        MaxLoss: [100],
        MaxGain: [300],
        Probability: [10],
        Amount: [2000],
        LegDistanceNew: [5],
        LegDistanceFurther: [20],
        TimeToExpiry: 30,
        RiskFreeRate: 2,
        DividendYield: 2,
        SelectedIVType: "Uniform",
        IVValue: 50,
        IVSkewRate: 1,
        SelectedUnitType: "Standard",
      }
    );
  }

  onStrategyChanged(selectedStrategy: OptionsStrategy) {
    if (selectedStrategy) {
      this.OptionParameterList = this.utilityService.getOptionParameters(selectedStrategy.Name);
      this.ConfigForm.patchValue({SelectedParameter: this.OptionParameterList[0]});
    } else {
      this.OptionParameterList = this.utilityService.getOptionParameters("");
      this.ConfigForm.patchValue({SelectedParameter: this.OptionParameterList[0]});
    }
  }

  onIVToggle(ivType: string) {
    this.ConfigForm.patchValue({SelectedIVType: ivType});
  }

  onUnitToggle(unitType: string) {
    this.ConfigForm.patchValue({SelectedUnitType: unitType});
  }

  confirmConfigChange() {
    var strategy = this.ConfigForm.get('SelectedStrategy')?.value;
    var parameter = this.ConfigForm.get('SelectedParameter')?.value;
    var legDistanceNew = this.ConfigForm.get('LegDistanceNew')?.value;
    var legDistanceFurther = this.ConfigForm.get('LegDistanceFurther')?.value;
    var timeToExpiry = this.ConfigForm.get('TimeToExpiry')?.value;
    var riskFreeRate = this.ConfigForm.get('RiskFreeRate')?.value;
    var dividendYield = this.ConfigForm.get('DividendYield')?.value;
    var ivType = this.ConfigForm.get('SelectedIVType')?.value;
    var ivValue = this.ConfigForm.get('IVValue')?.value;
    var ivSkewRate = this.ConfigForm.get('IVSkewRate')?.value;
    var amount = this.ConfigForm.get('Amount')?.value;
    var unitType = this.ConfigForm.get('SelectedUnitType')?.value;

    console.log(ivValue +"-"+ riskFreeRate + "-" + dividendYield + "-" + amount,"getSuccess");
    var requestObj = {
      strategy: strategy.Name,
      parameter: parameter.Name,
      legDistanceNew: legDistanceNew,
      legDistanceFurther: legDistanceFurther,
      timeToExpiry: timeToExpiry,
      riskFreeRate: riskFreeRate,
      dividendYield: dividendYield,
      ivType: ivType,
      ivValue: ivValue,
      ivSkewRate: ivSkewRate,
      amount: amount,
      unitType: unitType
    };

    console.log("Updating heatmap...", JSON.stringify(requestObj));
     this.updaterequestObj = {
      strategy: "IronCondor",
      Underlying: "AAPL",
      OptionContracts: "Iron Condor 2023-07-15 40|45|55|60",
     
    }
    this.analyticsService.ComputeAtmIV(this.updaterequestObj).subscribe(result => {
      console.log(result,"response123456")
   });
    // TODO: Get from API and bind result
    this.HeatmapColHeaders = [...Array(timeToExpiry).keys()].map(i => i + 1);
    this.HeatmapRowHeaders = [...Array(50).keys()].map(i => i + 160);

    if (unitType === "Standard") {
      for (var i = 0; i < 50; i++) {
        this.HeatmapData[i] = [];
        for (var j = 0; j < timeToExpiry; j++) {
          this.HeatmapData[i][j] = (Math.floor(Math.random() * 2000 - 1000));
        }
      }
    } else if (unitType === "Percentage") {
      for (var i = 0; i < 50; i++) {
        this.HeatmapData[i] = [];
        for (var j = 0; j < timeToExpiry; j++) {
          this.HeatmapData[i][j] = (Math.floor(Math.random() * 200 - 100));
        }
      }
    }
    this.AppliedUnitType = unitType;
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
  showModal(value:number){
    // alert(value);
    this.ModalNumber = value;
    this.formModal.show();
    // document.getElementById("modal_number").val
    // this.modalService.open(content, { size: 'lg' });
    //console.log(value),'this is nubmer');

  }
  getColorValue(value: number) {
    function rgToHex(value: number) {
      //value from 0 to 1
      var hue = ((1 - value) * 120).toString(10);
      return ["hsl(", hue, ",100%,50%)"].join("");
    }

    function normalize(val: number, max: number, min: number) {
      return (val - min) / (max - min);
    }

    if (this.AppliedUnitType === "Standard") {
      return rgToHex(normalize(value, -1000, 1000));
    } else if (this.AppliedUnitType === "Percentage") {
      return rgToHex(normalize(value, -100, 100));
    }
    return rgToHex(normalize(value, -100, 100));
  }

  ngAfterViewInit(){
    // $(".range-example-input").asRange({
    //   range: false,
    //   limit: false
    // });
  }

  ngOnInit(): void {
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('myModal')
    );
    // this.formModal.show();

  }

}
