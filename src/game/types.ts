// Game type definitions
export type Vector2D = {
	x: number;
	y: number;
};

export type Polygon = Vector2D[];

export type Color = string & { readonly __brand: "Color" };
