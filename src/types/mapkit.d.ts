declare namespace mapkit {
  class Map {
    constructor(container: HTMLElement, options?: MapConstructorOptions);
    region: CoordinateRegion;
    destroy(): void;
    addAnnotation(annotation: Annotation): void;
    addAnnotations(annotations: Annotation[]): void;
  }

  class Coordinate {
    constructor(latitude: number, longitude: number);
    latitude: number;
    longitude: number;
  }

  class CoordinateRegion {
    constructor(center: Coordinate, span: CoordinateSpan);
    center: Coordinate;
    span: CoordinateSpan;
  }

  class CoordinateSpan {
    constructor(latitudeDelta: number, longitudeDelta: number);
    latitudeDelta: number;
    longitudeDelta: number;
  }

  class MarkerAnnotation {
    constructor(coordinate: Coordinate, options?: AnnotationConstructorOptions);
  }

  interface MapConstructorOptions {
    showsCompass?: boolean;
    showsZoomControl?: boolean;
    showsMapTypeControl?: boolean;
    showsUserLocationControl?: boolean;
    showsScale?: boolean;
  }

  interface AnnotationConstructorOptions {
    title?: string;
    subtitle?: string;
    color?: string;
  }

  function init(options: {
    authorizationCallback(done: (token: string) => void): void;
    language?: string;
  }): void;
} 