// @mui material components
import Grid from "@mui/material/Grid";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

function Footer() {
  return (
    <VuiBox
      component="footer"
      py={6}
      sx={({ breakpoints }) => ({
        maxWidth: "450px",
        [breakpoints.down("xl")]: {
          maxWidth: "400px",
        },
      })}
    >
      <Grid container justifyContent="center">
        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <VuiTypography
            variant="button"
            sx={{ textAlign: "center", fontWeight: "400 !important" }}
            color="text"
          >
            @ 2025, Fais avec ❤️&nbsp; par :{" "}
            <VuiTypography
              component="a"
              variant="button"
              sx={{ textAlign: "center", fontWeight: "500 !important" }}
              color="text"
              mr="2px"
            >
              Florent Germain, Nathan Dubaille, Stanislas Legrand
            </VuiTypography>
            et
            <VuiTypography
              ml="2px"
              mr="2px"
              component="a"
              variant="button"
              sx={{ textAlign: "center", fontWeight: "500 !important" }}
              color="text"
            >
              Kévin Lemaire
            </VuiTypography>
            pour une Serre durable et propre
          </VuiTypography>
        </Grid>
      </Grid>
    </VuiBox>
  );
}

export default Footer;
