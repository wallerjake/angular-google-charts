import { SimpleChange } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';

import { ChartType } from '../models/chart-type.model';
import { ScriptLoaderService } from '../script-loader/script-loader.service';

import { GoogleChartComponent } from './google-chart.component';

jest.mock('../script-loader/script-loader.service');

const chartWrapperMock = {
  setChartType: jest.fn(),
  setDataTable: jest.fn(),
  setOptions: jest.fn(),
  draw: jest.fn(),
  getChart: jest.fn()
};

const visualizationMock = {
  ChartWrapper: jest.fn(),
  arrayToDataTable: jest.fn(),
  events: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
  }
};

describe('GoogleChartComponent', () => {
  let component: GoogleChartComponent;
  let fixture: ComponentFixture<GoogleChartComponent>;

  beforeEach(() => {
    visualizationMock.ChartWrapper.mockReturnValue(chartWrapperMock);
    globalThis.google = { visualization: visualizationMock } as any;
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GoogleChartComponent],
      providers: [ScriptLoaderService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should not throw when trying to access chart if its not yet drawn', () => {
    expect(() => component.chart).not.toThrow();
  });

  it('should load the packges needed for the chart type', () => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(EMPTY);

    changeInput('type', ChartType.BarChart);

    expect(service.loadChartPackages).toHaveBeenCalledWith('corechart');
  });

  it('should not throw if only the type, but no data is provided', async(() => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(of(void 0));

    changeInput('type', ChartType.BarChart);

    expect(component['wrapper']).toBeDefined();
    expect(chartWrapperMock.draw).toHaveBeenCalledTimes(1);
  }));

  it('should create the chart with the provided data and column names', () => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(of(void 0));

    const data = [
      ['First Row', 10],
      ['Second Row', 11]
    ];
    component.data = data;

    const columns = ['Some data', 'Some values'];
    component.columns = columns;

    const dataTableMock = {};
    visualizationMock.arrayToDataTable.mockReturnValueOnce(dataTableMock);

    const chartType = ChartType.BarChart;
    changeInput('type', chartType);

    expect(visualizationMock.arrayToDataTable).toHaveBeenCalledWith([columns, ...data], false);
    expect(chartWrapperMock.setDataTable).toHaveBeenCalledWith(dataTableMock);
    expect(chartWrapperMock.setChartType).toHaveBeenCalledWith(chartType);
    expect(chartWrapperMock.draw).toHaveBeenCalledTimes(1);
  });

  it('should draw the chart only once if `type`, `data` and `columns` changed all at once', () => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(of(void 0));

    const data = [
      ['First Row', 10],
      ['Second Row', 11]
    ];
    component.data = data;

    const columns = ['Some data', 'Some values'];
    component.columns = columns;

    const chartType = ChartType.BarChart;
    component.type = chartType;
    component.ngOnChanges({
      type: new SimpleChange(null, chartType, true),
      data: new SimpleChange(null, data, true),
      columns: new SimpleChange(null, columns, true)
    });

    expect(chartWrapperMock.draw).toHaveBeenCalledTimes(1);
  });

  it('should assume the first row is data if no columns are provided', () => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(of(void 0));

    const data = [
      ['First Row', 10],
      ['Second Row', 11]
    ];
    component.data = data;

    const dataTableMock = {};
    visualizationMock.arrayToDataTable.mockReturnValueOnce(dataTableMock);

    const chartType = ChartType.BarChart;
    changeInput('type', chartType);

    expect(visualizationMock.arrayToDataTable).toHaveBeenCalledWith(data, true);
    expect(chartWrapperMock.setDataTable).toHaveBeenCalledWith(dataTableMock);
    expect(chartWrapperMock.setChartType).toHaveBeenCalledWith(chartType);
    expect(chartWrapperMock.draw).toHaveBeenCalled();
  });

  it('should redraw the chart if `data` changed', () => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(of(void 0));

    const data = [
      ['First Row', 10],
      ['Second Row', 11]
    ];
    component.data = data;

    const columns = ['Some label', 'Some values'];
    component.columns = columns;

    const dataTableMock = {};
    visualizationMock.arrayToDataTable.mockReturnValueOnce(dataTableMock);

    const chartType = ChartType.BarChart;
    changeInput('type', chartType);

    const newData = [...data, ['Third Row', 12]];
    changeInput('data', newData);

    expect(visualizationMock.arrayToDataTable).toHaveBeenLastCalledWith([columns, ...newData], false);
    expect(chartWrapperMock.draw).toHaveBeenCalledTimes(2);
  });

  it('should redraw the chart if `columns` changed', () => {
    const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
    service.loadChartPackages.mockReturnValueOnce(of(void 0));

    const data = [
      ['First Row', 10],
      ['Second Row', 11]
    ];
    component.data = data;

    const columns = ['Some label', 'Some values'];
    component.columns = columns;

    const dataTableMock = {};
    visualizationMock.arrayToDataTable.mockReturnValueOnce(dataTableMock);

    const chartType = ChartType.BarChart;
    changeInput('type', chartType);

    const newColumns = ['New label', 'Some values'];
    changeInput('columns', newColumns);

    expect(visualizationMock.arrayToDataTable).toHaveBeenLastCalledWith([newColumns, ...data], false);
    expect(chartWrapperMock.draw).toHaveBeenCalledTimes(2);
  });

  describe('options', () => {
    beforeEach(() => {
      const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
      service.loadChartPackages.mockReturnValueOnce(of(void 0));
    });

    it('should use the provided options', () => {
      const options = { test: 'test' };
      component.options = options;

      changeInput('type', ChartType.BarChart);

      expect(chartWrapperMock.setOptions).toHaveBeenCalledWith(options);
    });

    it('should redraw the chart if options changed', () => {
      changeInput('type', ChartType.BarChart);

      const options = { test: 'test' };
      changeInput('options', options);

      expect(chartWrapperMock.setOptions).toHaveBeenLastCalledWith(options);
      expect(chartWrapperMock.draw).toHaveBeenCalledTimes(2);
    });

    it('should set the charts title', () => {
      const title = 'some title';
      component.title = title;

      changeInput('type', ChartType.BarChart);

      expect(chartWrapperMock.setOptions).toHaveBeenLastCalledWith({ title });
    });

    it('should redraw the chart if the title changed', () => {
      changeInput('type', ChartType.BarChart);

      const title = 'some title';
      changeInput('title', title);

      expect(chartWrapperMock.setOptions).toHaveBeenLastCalledWith({ title });
      expect(chartWrapperMock.draw).toHaveBeenCalledTimes(2);
    });

    it('should set the charts width and height', () => {
      const width = 100;
      component.width = width;

      const height = 200;
      component.height = height;

      changeInput('type', ChartType.BarChart);

      expect(chartWrapperMock.setOptions).toHaveBeenLastCalledWith({ width, height });
    });

    it('should redraw the chart if the width changed', () => {
      changeInput('type', ChartType.BarChart);

      const width = 100;
      changeInput('width', width);

      expect(chartWrapperMock.setOptions).toHaveBeenLastCalledWith({ width });
      expect(chartWrapperMock.draw).toHaveBeenCalledTimes(2);
    });

    it('should redraw the chart if the height changed', () => {
      changeInput('type', ChartType.BarChart);

      const height = 100;
      changeInput('height', height);

      expect(chartWrapperMock.setOptions).toHaveBeenLastCalledWith({ height });
      expect(chartWrapperMock.draw).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatters', () => {
    beforeEach(() => {
      const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
      service.loadChartPackages.mockReturnValueOnce(of(void 0));
    });

    it('should apply the provided formatters', () => {
      const formatter = { formatter: { format: jest.fn() }, colIndex: 1 };
      component.formatters = [formatter];

      const dataTableMock = {};
      visualizationMock.arrayToDataTable.mockReturnValueOnce(dataTableMock);

      changeInput('type', ChartType.BarChart);

      expect(formatter.formatter.format).toHaveBeenCalledWith(dataTableMock, formatter.colIndex);
    });

    it('should redraw the chart if the formatters changed', () => {
      changeInput('type', ChartType.BarChart);

      const formatter = { formatter: { format: jest.fn() }, colIndex: 1 };
      changeInput('formatters', [formatter]);

      expect(formatter.formatter.format).toHaveBeenCalled();
    });
  });

  describe('dynamicResize', () => {
    it('should subscribe to window resize event if set to true', () => {
      changeInput('dynamicResize', true);

      expect(component['resizeSubscription']).toBeTruthy();
    });

    it('should unsubscribe existing subscription if changed', () => {
      const subscriptionMock = { unsubscribe: jest.fn() };
      component['resizeSubscription'] = subscriptionMock as any;

      changeInput('dynamicResize', false);

      expect(subscriptionMock.unsubscribe).toHaveBeenCalled();
      expect(component['resizeSubscription']).toBeNull();
    });

    it('should do nothing if the window was resized, but the chart is not yet initialized', fakeAsync(() => {
      changeInput('dynamicResize', true);

      expect(() => {
        // This would cause an error if the wrapper would somehow be called
        window.dispatchEvent(new Event('resize'));
        tick(100);
      }).not.toThrow();
    }));

    it('should redraw the chart if the window was resized', fakeAsync(() => {
      changeInput('dynamicResize', true);

      const drawSpy = jest.fn();
      component['wrapper'] = { draw: drawSpy } as any;

      window.dispatchEvent(new Event('resize'));
      tick(100);

      expect(drawSpy).toHaveBeenCalled();
    }));

    describe('events', () => {
      beforeEach(() => {
        const service = TestBed.inject(ScriptLoaderService) as jest.Mocked<ScriptLoaderService>;
        service.loadChartPackages.mockReturnValueOnce(of(void 0));
      });

      it('should remove all event handlers before redrawing the chart', () => {
        changeInput('type', ChartType.BarChart);

        expect(visualizationMock.events.removeAllListeners).toHaveBeenCalled();
      });

      it('should register chart wrapper event handlers', () => {
        changeInput('type', ChartType.BarChart);

        expect(visualizationMock.events.addListener).toHaveBeenCalledWith(chartWrapperMock, 'ready', expect.any(Function));
        expect(visualizationMock.events.addListener).toHaveBeenCalledWith(chartWrapperMock, 'error', expect.any(Function));
        expect(visualizationMock.events.addListener).toHaveBeenCalledWith(chartWrapperMock, 'select', expect.any(Function));
      });

      it('should register mouse event handlers after the chart is drawn', () => {
        let readyCallback: Function;

        visualizationMock.events.addListener.mockImplementation((_, name, callback) => {
          if (name === 'ready') {
            readyCallback = callback;
          }
        });

        const chartMock = {};
        chartWrapperMock.getChart.mockReturnValue(chartMock);

        changeInput('type', ChartType.BarChart);

        expect(visualizationMock.events.addListener).not.toHaveBeenCalledWith(chartWrapperMock, 'onmouseover', expect.any(Function));
        expect(visualizationMock.events.addListener).not.toHaveBeenCalledWith(chartWrapperMock, 'onmouseout', expect.any(Function));

        readyCallback();

        expect(visualizationMock.events.addListener).toHaveBeenCalledWith(chartMock, 'onmouseover', expect.any(Function));
        expect(visualizationMock.events.addListener).toHaveBeenCalledWith(chartMock, 'onmouseout', expect.any(Function));
      });

      it.todo('should emit ready event after the chart is ready');

      it.todo('should emit error event if the chart caused an error');

      it('should emit select event if a value was selected', () => {
        let selectCallback: Function;

        visualizationMock.events.addListener.mockImplementation((_, name, callback) => {
          if (name === 'select') {
            selectCallback = callback;
          }
        });

        const selection = [{ column: 1, row: 2 }] as google.visualization.VisualizationSelectionArray[];

        const chartMock = { getSelection: jest.fn(() => selection) };
        chartWrapperMock.getChart.mockReturnValue(chartMock);

        const selectSpy = jest.fn();
        component.select.subscribe(event => selectSpy(event));

        changeInput('type', ChartType.BarChart);

        expect(selectSpy).not.toHaveBeenCalled();

        selectCallback();

        expect(selectSpy).toHaveBeenCalledWith({ selection });
      });
    });
  });

  function changeInput<K extends keyof GoogleChartComponent>(property: K, newValue: GoogleChartComponent[K]) {
    const oldValue = component[property];
    component[property as any] = newValue;
    component.ngOnChanges({ [property]: new SimpleChange(oldValue, newValue, oldValue == null) });
  }
});