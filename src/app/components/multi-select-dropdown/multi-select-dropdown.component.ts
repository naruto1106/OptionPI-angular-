import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-multi-select-dropdown',
  templateUrl: './multi-select-dropdown.component.html',
  styleUrls: ['./multi-select-dropdown.component.css']
})
export class MultiSelectDropdownComponent {
    @Input() list:any[];
    @Input() placeHolder: string = "";

    @Output() shareCheckedList = new EventEmitter();
    @Output() shareIndividualCheckedList = new EventEmitter();


    checkedList : any = [];
    currentSelected : any = {};
    showDropDown: boolean = false;

    constructor() {
      this.list = [];
      this.placeHolder = '';
      this.checkedList = [];
    }

    getSelectedValue(status:Boolean,value:String, indexOfItem: number){
        if(status){
          this.checkedList.push({checked: status, name: value, index: indexOfItem});
        }else{
            var index = this.checkedList.indexOf(value);
            this.checkedList.splice(index,1);
        }

        this.currentSelected = {checked : status, name:value};

        //share checked list
        this.shareCheckedlist();

        //share individual selected item
        this.shareIndividualStatus();
    }

    shareCheckedlist(){
         this.shareCheckedList.emit(this.checkedList);
    }
    shareIndividualStatus(){
        this.shareIndividualCheckedList.emit(this.currentSelected);
    }
}