// Game type definitions
export type Vector2D = {
	x: number;
	y: number;
};

export type Polygon = Vector2D[];

export type GameObjects = {
	id: number;
	points: Polygon
};

