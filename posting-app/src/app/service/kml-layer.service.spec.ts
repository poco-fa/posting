import { TestBed } from '@angular/core/testing';
import { KmlLayerService, KmlLayerInfo } from './kml-layer.service';

describe('KmlLayerService', () => {
  let service: KmlLayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KmlLayerService);
    
    // ローカルストレージをクリア
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a valid KML layer', () => {
    const url = 'https://example.com/test.kml';
    const name = 'Test Layer';
    
    const layer = service.addLayer(url, name);
    
    expect(layer).toBeTruthy();
    expect(layer?.name).toBe(name);
    expect(layer?.url).toBe(url);
    expect(layer?.visible).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const invalidUrls = [
      'not-a-url',
      'ftp://example.com/test.kml',
      'https://example.com/test.txt'
    ];
    
    invalidUrls.forEach(url => {
      const layer = service.addLayer(url);
      expect(layer).toBeNull();
    });
  });

  it('should accept Google My Maps URLs', () => {
    const googleMapsUrl = 'https://www.google.com/maps/d/viewer?mid=1AL15p_uKP1JPhBH_4RrptagM2hqgZlA';
    
    const layer = service.addLayer(googleMapsUrl);
    
    expect(layer).toBeTruthy();
    expect(layer?.name).toBe('Google My Maps');
  });

  it('should toggle layer visibility', () => {
    const layer = service.addLayer('https://example.com/test.kml');
    expect(layer?.visible).toBe(true);
    
    service.toggleLayerVisibility(layer!.id, false);
    
    const layers = service.getLayers();
    const updatedLayer = layers.find(l => l.id === layer!.id);
    expect(updatedLayer?.visible).toBe(false);
  });

  it('should remove layer', () => {
    const layer = service.addLayer('https://example.com/test.kml');
    expect(service.getLayers().length).toBe(1);
    
    service.removeLayer(layer!.id);
    
    expect(service.getLayers().length).toBe(0);
  });

  it('should persist layers to localStorage', () => {
    const url = 'https://example.com/test.kml';
    const name = 'Test Layer';
    
    service.addLayer(url, name);
    
    // 新しいサービスインスタンスを作成してローカルストレージから読み込み
    const newService = new KmlLayerService();
    const layers = newService.getLayers();
    
    expect(layers.length).toBe(1);
    expect(layers[0].name).toBe(name);
    expect(layers[0].url).toBe(url);
  });
});