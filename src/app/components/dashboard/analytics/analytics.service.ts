import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/common/config.service'
import { catchError, map } from 'rxjs/operators';
import { HandleError, HttpErrorHandler } from 'src/app/common/http-error-handler.service';
import { PayoffWithIVolRequest } from 'src/app/interface/payoff-with-ivol-request';
import { PayoffWithTimeRequest } from 'src/app/interface/payoff-with-time-request';
import { PayoffProbabilityChartRequest } from 'src/app/interface/payoff-probability-chart-request';
import { PayoffProbabilityRequest } from 'src/app/interface/payoff-probability-request';
import { AnalysisEntry } from 'src/app/interface/analysis-entry';
import { HeatmapEntry } from 'src/app/interface/heatmap-entry';
import { PayoffTableEntry } from 'src/app/interface/payoff-table-entry';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private baseUrl = '';
    private serverApiKey = '';
    private accessToken = '';
    private handleError: HandleError;

    constructor(private http: HttpClient, private configService: ConfigService,
        httpErrorHandler: HttpErrorHandler) {        
        this.handleError = httpErrorHandler.createHandleError('AnalyticsService');
    }

    /** POST: getHeatmap */
    getHeatmap(requestObj: AnalysisEntry): Observable<HeatmapEntry[]> {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.post<HeatmapEntry[]>(this.baseUrl + "/optionapi/v1/Analytics/GetHeatmap", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<HeatmapEntry[]>('FutuOmsHistorical/GetHistoricalPositions'))
        );
    }
    GetMetricsForAnalyzeModelValuation(requestObj: AnalysisEntry): Observable<HeatmapEntry[]> {
        console.log(requestObj,"analytic.services");
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.post<HeatmapEntry[]>(this.baseUrl + "/optionapi/v1/Analytics/GetMetricsForAnalyzeModelValuation", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<HeatmapEntry[]>('FutuOmsHistorical/GetHistoricalPositions'))
        );
    }
    ComputeAtmIV(requestObj: AnalysisEntry): Observable<HeatmapEntry[]> {
        console.log(requestObj,"analytic.services123");
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.post<HeatmapEntry[]>(this.baseUrl + "/optionapi/v1/Analytics/ComputeAtmIV", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<HeatmapEntry[]>('FutuOmsHistorical/GetHistoricalPositions'))
        );
    }

    /** POST: getPayoffProbability */
    getPayoffProbability(requestObj: PayoffProbabilityRequest): Observable<PayoffTableEntry[]> {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        return this.http.post<PayoffTableEntry[]>(this.baseUrl + "/optionapi/v1/Analytics/GetPayoffProbability", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        }).pipe(
            catchError(this.handleError<PayoffTableEntry[]>('FutuOmsHistorical/GetHistoricalPositions'))
        );
    }

    /** GET: getOptionSnapshot */
    getPayoffProbabilityChart(requestObj: PayoffProbabilityChartRequest): void {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        this.http.post(this.baseUrl + "/optionapi/v1/Analytics/GetPayoffProbabilityChart", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        });
    }

    /** GET: getPayoffWithTime */
    getPayoffWithTime(requestObj: PayoffWithTimeRequest): void {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        this.http.post(this.baseUrl + "/optionapi/v1/Analytics/GetPayoffWithTime", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        });
    }

    /** GET: getPayoffWithIV */
    getPayoffWithIV(requestObj: PayoffWithIVolRequest): void {
        let config = this.configService.readConfig();
        if (config) {
            this.baseUrl = config.apiUrl;
            this.serverApiKey = config.serverApiKey;
        }
        let userCredentialString = localStorage.getItem('user-credential');
        if (userCredentialString) {
            var userCredential = JSON.parse(userCredentialString);
            this.accessToken = userCredential.access_token;
        }
        this.http.post(this.baseUrl + "/optionapi/v1/Analytics/GetPayoffWithIV", requestObj, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                //'ApiKey': this.serverApiKey,
                'Authorization': 'Bearer ' + this.accessToken
            })
        });
    }
}
